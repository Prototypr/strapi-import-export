import cloneDeep from 'lodash/cloneDeep';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import castArray from 'lodash/castArray';
import { extract, toArray } from '../../../libs/arrays.js';
import { ObjectBuilder } from '../../../libs/objects.js';
import { getModel, getModelAttributes, isComponentAttribute, isDynamicZoneAttribute, isMediaAttribute, isRelationAttribute } from '../../utils/models.js';
import { head, toPairs } from 'lodash';
import { findOrImportFile } from './utils/file.js';

class IdMapper {
  constructor() {
    this.mapping = {};
  }

  getMapping(slug, fileId) {
    return this.mapping[slug]?.get(`${fileId}`);
  }

  setMapping(slug, fileId, dbId) {
    if (!this.mapping[slug]) {
      this.mapping[slug] = new Map();
    }

    this.mapping[slug].set(`${fileId}`, dbId);
  }
}

/**
 * Import data.
 * @returns {Promise<ImportDataRes>}
 */
const importDataV2 = async (
  fileContent,
  {
    slug: slugArg,
    user,
    idField,
  },
) => {
  const { data } = fileContent;

  const slugs = Object.keys(data);
  let failures = [];
  const fileIdToDbId = new IdMapper();

  const { componentSlugs, mediaSlugs, contentTypeSlugs } = splitSlugs(slugs);
  const componentsDataStore = {};
  for (const slug of componentSlugs) {
    componentsDataStore[slug] = data[slug];
  }

  for (const slug of mediaSlugs) {
    const res = await importMedia(data[slug], { user, fileIdToDbId });
    failures.push(...res.failures);
  }

  // Import content types without setting relations.
  for (const slug of contentTypeSlugs) {
    const res = await importContentTypeSlug(data[slug], {
      slug: slug,
      user,
      // Keep behavior of `idField` of version 1.
      ...(slug === slugArg ? { idField } : {}),
      importStage: 'simpleAttributes',
      fileIdToDbId,
      componentsDataStore,
    });
    failures.push(...res.failures);
  }

  // Set relations of content types.
  for (const slug of contentTypeSlugs) {
    const res = await importContentTypeSlug(data[slug], {
      slug: slug,
      user,
      // Keep behavior of `idField` of version 1.
      ...(slug === slugArg ? { idField } : {}),
      importStage: 'relationAttributes',
      fileIdToDbId,
      componentsDataStore,
    });
    failures.push(...res.failures);
  }

  // Sync primary key sequence for postgres databases.
  // See https://github.com/strapi/strapi/issues/12493.
  if (strapi.db.config.connection.client === 'postgres') {
    for (const slugFromFile of slugs) {
      const model = getModel(slugFromFile);
      // TODO: handle case when `id` is not a number;
      await strapi.db.connection.raw(`SELECT SETVAL((SELECT PG_GET_SERIAL_SEQUENCE('${model.collectionName}', 'id')), (SELECT MAX(id) FROM ${model.collectionName}) + 1, FALSE);`);
    }
  }

  return { failures };
};

function splitSlugs(slugs) {
  const slugsToProcess = [...slugs];
  const componentSlugs = extract(slugsToProcess, (slug) => getModel(slug)?.modelType === 'component');
  const mediaSlugs = extract(slugsToProcess, (slug) => ['plugin::upload.file'].includes(slug));
  const contentTypeSlugs = extract(slugsToProcess, (slug) => getModel(slug)?.modelType === 'contentType');

  if (slugsToProcess.length > 0) {
    strapi.log.warn(`Some slugs won't be imported: ${slugsToProcess.join(', ')}`);
  }

  return {
    componentSlugs,
    mediaSlugs,
    contentTypeSlugs,
  };
}

const importMedia = async (slugEntries, { user, fileIdToDbId }) => {
  const failures = [];

  const fileEntries = toPairs(slugEntries);

  for (let [fileId, fileEntry] of fileEntries) {
    try {
      const dbEntry = await findOrImportFile(fileEntry, user, { allowedFileTypes: ['any'] });
      if (dbEntry) {
        fileIdToDbId.setMapping('plugin::upload.file', fileId, dbEntry?.id);
      }
    } catch (err) {
      strapi.log.error(err);
      failures.push({ error: err, data: fileEntry });
    }
  }

  return {
    failures,
  };
};

const importContentTypeSlug = async (
  slugEntries,
  {
    slug,
    user,
    idField,
    importStage,
    fileIdToDbId,
    componentsDataStore,
  },
) => {
  let fileEntries = toPairs(slugEntries);

  // Sort localized data with default locale first.
  const sortDataByLocale = async () => {
    const schema = getModel(slug);

    if (schema.pluginOptions?.i18n?.localized) {
      const defaultLocale = await strapi.plugin('i18n').service('locales').getDefaultLocale();
      fileEntries = fileEntries.sort((dataA, dataB) => {
        if (dataA[1].locale === defaultLocale && dataB[1].locale === defaultLocale) {
          return 0;
        } else if (dataA[1].locale === defaultLocale) {
          return -1;
        }
        return 1;
      });
    }
  };
  await sortDataByLocale();

  const failures = [];
  for (let [fileId, fileEntry] of fileEntries) {
    try {
      await updateOrCreate(user, slug, fileId, fileEntry, idField, { importStage, fileIdToDbId, componentsDataStore });
    } catch (err) {
      strapi.log.error(err);
      failures.push({ error: err, data: fileEntry });
    }
  }

  return {
    failures,
  };
};

const updateOrCreate = async (
  user,
  slug,
  fileId,
  fileEntryArg,
  idFieldArg,
  { importStage, fileIdToDbId, componentsDataStore },
) => {
  const schema = getModel(slug);
  const idField = idFieldArg || schema?.pluginOptions?.['import-export-entries']?.idField || 'id';

  let fileEntry = cloneDeep(fileEntryArg);

  if (importStage == 'simpleAttributes') {
    fileEntry = removeComponents(schema, fileEntry);
    fileEntry = linkMediaAttributes(schema, fileEntry, { fileIdToDbId });
    const attributeNames = getModelAttributes(slug, { filterOutType: ['relation'] })
      .map(({ name }) => name)
      .concat('id', 'localizations', 'locale');
    fileEntry = pick(fileEntry, attributeNames);
  } else if (importStage === 'relationAttributes') {
    fileEntry = setComponents(schema, fileEntry, { fileIdToDbId, componentsDataStore });
    const attributeNames = getModelAttributes(slug, { filterType: ['component', 'dynamiczone', 'relation'] })
      .map(({ name }) => name)
      .concat('id', 'localizations', 'locale');
    fileEntry = pick(fileEntry, attributeNames);
  }

  let dbEntry = null;
  if (schema?.modelType === 'contentType' && schema?.kind === 'singleType') {
    dbEntry = await updateOrCreateSingleTypeEntry(user, slug, fileId, fileEntry, { importStage, fileIdToDbId });
  } else {
    dbEntry = await updateOrCreateCollectionTypeEntry(user, slug, fileId, fileEntry, { idField, importStage, fileIdToDbId });
  }
  if (dbEntry) {
    fileIdToDbId.setMapping(slug, fileId, dbEntry.id);
  }
};

function linkMediaAttributes(schema, fileEntry, { fileIdToDbId }) {
  for (const [attributeName, attribute] of Object.entries(schema.attributes)) {
    let attributeValue = fileEntry[attributeName];
    if (attributeValue == null) {
      continue;
    }

    if (isMediaAttribute(attribute)) {
      attributeValue = castArray(attributeValue)
        .map((id) => fileIdToDbId.getMapping('plugin::upload.file', id))
        .filter(Boolean);

      if (!attribute.multiple) {
        attributeValue = attributeValue[0];
      }

      fileEntry[attributeName] = attributeValue;
    }
  }

  return fileEntry;
}

function removeComponents(schema, fileEntry) {
  const store = {};
  for (const [attributeName, attribute] of Object.entries(schema.attributes)) {
    // Do not reset an attribute component that is not imported.
    if (typeof fileEntry[attributeName] === 'undefined') {
      continue;
    }

    if (isComponentAttribute(attribute)) {
      if (attribute.repeatable) {
        store[attributeName] = [];
      } else {
        store[attributeName] = null;
      }
    } else if (isDynamicZoneAttribute(attribute)) {
      store[attributeName] = [];
    }
  }

  return { ...fileEntry, ...(store || {}) };
}

function setComponents(
  schema,
  fileEntry,
  { fileIdToDbId, componentsDataStore },
) {
  const store = {};
  for (const [attributeName, attribute] of Object.entries(schema.attributes)) {
    const attributeValue = fileEntry[attributeName];
    if (attributeValue == null) {
      continue;
    } else if (isComponentAttribute(attribute)) {
      if (attribute.repeatable) {
        store[attributeName] = attributeValue.map((componentFileId) =>
          getComponentData(attribute.component, `${componentFileId}`, { fileIdToDbId, componentsDataStore }),
        );
      } else {
        store[attributeName] = getComponentData(attribute.component, `${attributeValue}`, { fileIdToDbId, componentsDataStore });
      }
    } else if (isDynamicZoneAttribute(attribute)) {
      store[attributeName] = attributeValue.map(({ __component, id }) => getComponentData(__component, `${id}`, { fileIdToDbId, componentsDataStore }));
    }
  }

  return { ...fileEntry, ...(store || {}) };
}

function getComponentData(
  slug,
  fileId,
  { fileIdToDbId, componentsDataStore },
) {
  const schema = getModel(slug);
  const fileEntry = componentsDataStore[slug][`${fileId}`];

  if (fileEntry == null) {
    return null;
  }

  const store = { ...omit(fileEntry, ['id']), __component: slug };

  for (const [attributeName, attribute] of Object.entries(schema.attributes)) {
    const attributeValue = fileEntry[attributeName];
    if (attributeValue == null) {
      store[attributeName] = null;
      continue;
    }

    if (isComponentAttribute(attribute)) {
      if (attribute.repeatable) {
        store[attributeName] = attributeValue.map((componentFileId) =>
          getComponentData(attribute.component, `${componentFileId}`, { fileIdToDbId, componentsDataStore }),
        );
      } else {
        store[attributeName] = getComponentData(attribute.component, `${attributeValue}`, { fileIdToDbId, componentsDataStore });
      }
    } else if (isDynamicZoneAttribute(attribute)) {
      store[attributeName] = attributeValue.map(({ __component, id }) => getComponentData(__component, `${id}`, { fileIdToDbId, componentsDataStore }));
    } else if (isMediaAttribute(attribute)) {
      if (attribute.multiple) {
        store[attributeName] = attributeValue.map((id) => fileIdToDbId.getMapping('plugin::upload.file', id));
      } else {
        store[attributeName] = fileIdToDbId.getMapping('plugin::upload.file', attributeValue);
      }
    } else if (isRelationAttribute(attribute)) {
      if (attribute.relation.endsWith('Many')) {
        store[attributeName] = attributeValue.map((id) => fileIdToDbId.getMapping(attribute.target, id));
      } else {
        store[attributeName] = fileIdToDbId.getMapping(attribute.target, attributeValue);
      }
    } else if (isMediaAttribute(attribute)) {
      if (attribute.multiple) {
        store[attributeName] = castArray(attributeValue).map((id) => fileIdToDbId.getMapping('plugin::upload.file', id));
      } else {
        store[attributeName] = fileIdToDbId.getMapping('plugin::upload.file', `${head(castArray(attributeValue))}`);
      }
    }
  }

  return store;
}

const updateOrCreateCollectionTypeEntry = async (
  user,
  slug,
  fileId,
  fileEntry,
  { idField, importStage, fileIdToDbId },
) => {
  const schema = getModel(slug);

  const whereBuilder = new ObjectBuilder();
  if (fileIdToDbId.getMapping(slug, fileId)) {
    whereBuilder.extend({ id: fileIdToDbId.getMapping(slug, fileId) });
  } else if (fileEntry[idField]) {
    whereBuilder.extend({ [idField]: fileEntry[idField] });
  }
  const where = whereBuilder.get();

  if (!schema.pluginOptions?.i18n?.localized) {
    let dbEntry = await strapi.db.query(slug).findOne({ where });

    if (!dbEntry) {
      return strapi.entityService.create(slug, { data: fileEntry });
    } else {
      return strapi.entityService.update(slug, dbEntry.id, { data: omit(fileEntry, ['id']) });
    }
  } else {
    if (!fileEntry.locale) {
      throw new Error(`No locale set to import entry for slug ${slug} (data ${JSON.stringify(fileEntry)})`);
    }

    const defaultLocale = await strapi.plugin('i18n').service('locales').getDefaultLocale();
    const isDatumInDefaultLocale = fileEntry.locale === defaultLocale;

    let dbEntryDefaultLocaleId = null;
    let dbEntry = await strapi.db.query(slug).findOne({ where, populate: ['localizations'] });
    if (isDatumInDefaultLocale) {
      dbEntryDefaultLocaleId = dbEntry?.id || null;
    } else {
      if (dbEntry) {
        // If `dbEntry` has been found, `dbEntry` holds the data for the default locale and
        // the data for other locales in its `localizations` attribute.
        const localizedEntries = [dbEntry, ...(dbEntry?.localizations || [])];
        dbEntryDefaultLocaleId = localizedEntries.find((e) => e.locale === defaultLocale)?.id || null;
        dbEntry = localizedEntries.find((e) => e.locale === fileEntry.locale) || null;
      } else {
        // Otherwise try to find dbEntry for default locale through localized siblings.
        let idx = 0;
        const fileLocalizationsIds = fileEntry?.localizations || [];
        while (idx < fileLocalizationsIds.length && !dbEntryDefaultLocaleId && !dbEntry) {
          const dbId = fileIdToDbId.getMapping(slug, fileLocalizationsIds[idx]);
          const localizedEntry = await strapi.db.query(slug).findOne({ where: { id: dbId }, populate: ['localizations'] });
          const localizedEntries = localizedEntry != null ? [localizedEntry, ...(localizedEntry?.localizations || [])] : [];
          if (!dbEntryDefaultLocaleId) {
            dbEntryDefaultLocaleId = localizedEntries.find((e) => e.locale === defaultLocale)?.id || null;
          }
          if (!dbEntry) {
            dbEntry = localizedEntries.find((e) => e.locale === fileEntry.locale) || null;
          }
          idx += 1;
        }
      }
    }

    fileEntry = omit(fileEntry, ['localizations']);
    if (isEmpty(omit(fileEntry, ['id']))) {
      return null;
    }

    if (isDatumInDefaultLocale) {
      if (!dbEntryDefaultLocaleId) {
        return strapi.entityService.create(slug, { data: fileEntry });
      } else {
        return strapi.entityService.update(slug, dbEntryDefaultLocaleId, { data: omit({ ...fileEntry }, ['id']) });
      }
    } else {
      if (!dbEntryDefaultLocaleId) {
        throw new Error(`Could not find default locale entry to import localization for slug ${slug} (data ${JSON.stringify(fileEntry)})`);
      }

      if (!dbEntry) {
        const insertLocalizedEntry = strapi.plugin('i18n').service('core-api').createCreateLocalizationHandler(getModel(slug));
        return insertLocalizedEntry({ id: dbEntryDefaultLocaleId, data: omit({ ...fileEntry }, ['id']) });
      } else {
        return strapi.entityService.update(slug, dbEntry.id, { data: omit({ ...fileEntry }, ['id']) });
      }
    }
  }
};

const updateOrCreateSingleTypeEntry = async (
  user,
  slug,
  fileId,
  fileEntry,
  { importStage, fileIdToDbId },
) => {
  const schema = getModel(slug);

  if (!schema.pluginOptions?.i18n?.localized) {
    let dbEntry = await strapi.db
      .query(slug)
      .findMany({})
      .then((entries) => toArray(entries)?.[0]);

    if (!dbEntry) {
      return strapi.entityService.create(slug, { data: fileEntry });
    } else {
      return strapi.entityService.update(slug, dbEntry.id, { data: omit(fileEntry, ['id']) });
    }
  } else {
    const defaultLocale = await strapi.plugin('i18n').service('locales').getDefaultLocale();
    const isDatumInDefaultLocale = !fileEntry.locale || fileEntry.locale === defaultLocale;

    fileEntry = omit(fileEntry, ['localizations']);
    if (isEmpty(omit(fileEntry, ['id']))) {
      return null;
    }

    let entryDefaultLocale = await strapi.db.query(slug).findOne({ where: { locale: defaultLocale } });
    if (!entryDefaultLocale) {
      entryDefaultLocale = await strapi.entityService.create(slug, { data: { ...fileEntry, locale: defaultLocale } });
    }

    if (isDatumInDefaultLocale) {
      if (!entryDefaultLocale) {
        return strapi.entityService.create(slug, { data: fileEntry });
      } else {
        return strapi.entityService.update(slug, entryDefaultLocale.id, { data: fileEntry });
      }
    } else {
      const entryLocale = await strapi.db.query(slug).findOne({ where: { locale: fileEntry.locale } });
      let datumLocale = { ...entryLocale, ...fileEntry };

      await strapi.db.query(slug).delete({ where: { locale: fileEntry.locale } });

      const insertLocalizedEntry = strapi.plugin('i18n').service('core-api').createCreateLocalizationHandler(getModel(slug));
      return insertLocalizedEntry({ id: entryDefaultLocale.id, data: datumLocale });
    }
  }
};

export {
  importDataV2,
};