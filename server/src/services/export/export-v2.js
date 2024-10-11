import cloneDeep from 'lodash/cloneDeep';
import fromPairs from 'lodash/fromPairs';
import { isEmpty, merge } from 'lodash/fp';
import qs from 'qs';
import { isArraySafe, toArray } from '../../../libs/arrays.js';
import { CustomSlugToSlug, CustomSlugs } from '../../config/constants.js';
import { ObjectBuilder, isObjectSafe, mergeObjects } from '../../../libs/objects.js';
import {
  getModelAttributes,
  getAllSlugs,
  isComponentAttribute,
  isDynamicZoneAttribute,
  isMediaAttribute,
  isRelationAttribute,
  getModel,
  deleteEntryProp,
  setEntryProp,
  getEntryProp,
} from '../../utils/models.js';
import * as converters from './converters-v2.js';

const dataFormats = {
  JSON: 'json',
};

const dataConverterConfigs = {
  [dataFormats.JSON]: {
    convertEntries: converters.convertToJson,
  },
};

/**
 * Export data.
 */
async function exportDataV2({
  slug,
  search,
  applySearch,
  deepness = 5,
  exportPluginsContentTypes,
}) {
  const slugsToExport =
    slug === CustomSlugs.WHOLE_DB ? getAllSlugs({ includePluginsContentTypes: exportPluginsContentTypes }) : toArray(CustomSlugToSlug[slug] || slug);

  let store = {};
  for (const slug of slugsToExport) {
    const hierarchy = buildSlugHierarchy(slug, deepness);
    store = await findEntriesForHierarchy(store, slug, hierarchy, deepness, { ...(applySearch ? { search } : {}) });
  }
  const jsoContent = {
    version: 2,
    data: store,
  };
  const fileContent = convertData(jsoContent, {
    dataFormat: 'json',
  });
  return fileContent;
}

async function findEntriesForHierarchy(
  store,
  slug,
  hierarchy,
  deepness,
  { search, ids },
) {
  const schema = getModel(slug);

  if (schema.uid === 'admin::user') {
    return {};
  }

  let entries = await findEntries(slug, deepness, { search, ids })
    .then((entries) => {
      entries = toArray(entries).filter(Boolean);

      // Export locales
      if (schema.pluginOptions?.i18n?.localized) {
        const allEntries = [...entries];
        const entryIdsToExported = fromPairs(allEntries.map((entry) => [entry.id, true]));

        for (const entry of entries) {
          (entry.localizations || []).forEach((localization) => {
            if (localization.id && !entryIdsToExported[localization.id]) {
              allEntries.push(localization);
              entryIdsToExported[localization.id] = true;
            }
          });
        }

        return allEntries;
      }

      return entries;
    })
    .then((entries) => toArray(entries));

  // Transform relations as ids.
  let entriesFlatten = cloneDeep(entries);
  (() => {
    const flattenEntryCommon = (entry) => {
      if (entry == null) {
        return null;
      } else if (isArraySafe(entry)) {
        return entry.map((rel) => {
          if (isObjectSafe(rel)) {
            return rel.id;
          }
          return rel;
        });
      } else if (isObjectSafe(entry)) {
        return entry.id;
      }
      return entry;
    };

    const flattenProperty = (propAttribute, propEntries) => {
      if (propEntries == null) {
        return null;
      } else if (isComponentAttribute(propAttribute)) {
        return flattenEntryCommon(propEntries);
      } else if (isDynamicZoneAttribute(propAttribute)) {
        return propEntries.map((entry) => ({
          __component: entry.__component,
          id: entry.id,
        }));
      } else if (isMediaAttribute(propAttribute)) {
        return flattenEntryCommon(propEntries);
      } else if (isRelationAttribute(propAttribute)) {
        return flattenEntryCommon(propEntries);
      }
      return propEntries;
    };

    const flattenEntry = (entry, slug) => {
      const attributes = getModelAttributes(slug, { filterType: ['component', 'dynamiczone', 'media', 'relation'] });

      for (const attribute of attributes) {
        setEntryProp(entry, attribute.name, flattenProperty(attribute, getEntryProp(entry, attribute.name)));
      }

      return entry;
    };

    entriesFlatten = entriesFlatten.map((entry) => flattenEntry(entry, slug));
  })();

  store = mergeObjects({ [slug]: Object.fromEntries(entriesFlatten.map((entry) => [entry.id, entry])) }, store);

  // Skip admin::user slug.
  const filterOutUnwantedRelations = () => {
    const UNWANTED_RELATIONS = ['admin::user'];
    const attributes = getModelAttributes(slug, { filterType: ['relation'] });

    return entries.map((entry) => {
      attributes.forEach((attribute) => {
        if (UNWANTED_RELATIONS.includes(attribute.target)) {
          deleteEntryProp(entry, attribute.name);
        }
      });
      return entry;
    });
  };
  filterOutUnwantedRelations();

  const findAndFlattenComponentAttributes = async () => {
    let attributes = getModelAttributes(slug, { filterType: ['component'] });
    for (const attribute of attributes) {
      const attributeSlug = hierarchy[attribute.name]?.__slug;
      if (!attributeSlug) {
        continue;
      }

      const ids = entries
        .filter((entry) => !!getEntryProp(entry, attribute.name))
        .flatMap((entry) => getEntryProp(entry, attribute.name))
        .filter((entry) => !!entry.id)
        .map((entry) => entry.id)
        .filter((id) => typeof store?.[attributeSlug]?.[`${id}`] === 'undefined');

      const dataToStore = await findEntriesForHierarchy(store, attributeSlug, hierarchy[attribute.name], deepness - 1, { ids });
      store = mergeObjects(dataToStore, store);
    }
  };
  await findAndFlattenComponentAttributes();

  const findAndFlattenDynamicZoneAttributes = async () => {
    let attributes = getModelAttributes(slug, { filterType: ['dynamiczone'] });
    for (const attribute of attributes) {
      for (const slugFromAttribute of attribute.components) {
        const componentHierarchy = hierarchy[attribute.name]?.[slugFromAttribute];
        const componentSlug = componentHierarchy?.__slug;
        if (!componentSlug) {
          continue;
        }

        const ids = entries
          .filter((entry) => !!getEntryProp(entry, attribute.name))
          .flatMap((entry) => getEntryProp(entry, attribute.name))
          .filter((entry) => entry?.__component === slugFromAttribute)
          .map((entry) => entry.id)
          .filter((id) => typeof store?.[componentSlug]?.[`${id}`] === 'undefined');

        const dataToStore = await findEntriesForHierarchy(store, componentSlug, componentHierarchy, deepness - 1, { ids });
        store = mergeObjects(dataToStore, store);
      }
    }
  };
  await findAndFlattenDynamicZoneAttributes();

  const findAndFlattenMediaAttributes = async () => {
    let attributes = getModelAttributes(slug, { filterType: ['media'] });
    for (const attribute of attributes) {
      const attributeSlug = hierarchy[attribute.name]?.__slug;
      if (!attributeSlug) {
        continue;
      }

      const ids = entries
        .filter((entry) => !!getEntryProp(entry, attribute.name))
        .flatMap((entry) => getEntryProp(entry, attribute.name))
        .filter((entry) => !!entry.id)
        .map((entry) => entry.id)
        .filter((id) => typeof store?.[attributeSlug]?.[`${id}`] === 'undefined');

      const dataToStore = await findEntriesForHierarchy(store, attributeSlug, hierarchy[attribute.name], deepness - 1, { ids });
      store = mergeObjects(dataToStore, store);
    }
  };
  await findAndFlattenMediaAttributes();

  const findAndFlattenRelationAttributes = async () => {
    let attributes = getModelAttributes(slug, { filterType: ['relation'] });
    for (const attribute of attributes) {
      const attributeSlug = hierarchy[attribute.name]?.__slug;
      if (!attributeSlug) {
        continue;
      }

      const ids = entries
        .filter((entry) => !!getEntryProp(entry, attribute.name))
        .flatMap((entry) => getEntryProp(entry, attribute.name))
        .filter((entry) => !!entry.id)
        .map((entry) => entry.id)
        .filter((id) => typeof store?.[attributeSlug]?.[`${id}`] === 'undefined');

      const dataToStore = await findEntriesForHierarchy(store, attributeSlug, hierarchy[attribute.name], deepness - 1, { ids });
      store = mergeObjects(dataToStore, store);
    }
  };
  await findAndFlattenRelationAttributes();

  return store;
}

async function findEntries(slug, deepness, { search, ids }) {
  try {
    const queryBuilder = new ObjectBuilder();
    queryBuilder.extend(getPopulateFromSchema(slug, deepness));
    if (search) {
      queryBuilder.extend(buildFilterQuery(search));
    } else if (ids) {
      queryBuilder.extend({
        filters: {
          id: { $in: ids },
        },
      });
    }

    // deprecated:
    // const entries = await strapi.entityService.findMany(slug, queryBuilder.get());
    const entries = await strapi.documents(slug).findMany(queryBuilder.get());

    return entries;
  } catch (_) {
    return [];
  }
}

function buildFilterQuery(search = '') {
  let { filters, sort: sortRaw } = qs.parse(search);

  // TODO: improve query parsing
  const [attr, value] = (sortRaw)?.split(':') || [];
  const sort = {};
  if (attr && value) {
    sort[attr] = value.toLowerCase();
  }

  return {
    filters,
    sort,
  };
}

function convertData(exportContent, options) {
  const converter = getConverter(options.dataFormat);

  const convertedData = converter.convertEntries(exportContent, options);

  return convertedData;
}

function getConverter(dataFormat) {
  const converter = dataConverterConfigs[dataFormat];

  if (!converter) {
    throw new Error(`Data format ${dataFormat} is not supported.`);
  }

  return converter;
}

function getPopulateFromSchema(slug, deepness = 5) {
  if (deepness <= 1) {
    return true;
  }

  if (slug === 'admin::user') {
    return undefined;
  }

  const populate = {};
  const model = strapi.getModel(slug);
  for (const [attributeName, attribute] of Object.entries(getModelPopulationAttributes(model))) {
    if (!attribute) {
      continue;
    }

    if (isComponentAttribute(attribute)) {
      populate[attributeName] = getPopulateFromSchema(attribute.component, deepness - 1);
    } else if (isDynamicZoneAttribute(attribute)) {
      const dynamicPopulate = attribute.components.reduce((zonePopulate, component) => {
        const compPopulate = getPopulateFromSchema(component, deepness - 1);
        return compPopulate === true ? zonePopulate : merge(zonePopulate, compPopulate);
      }, {});
      populate[attributeName] = isEmpty(dynamicPopulate) ? true : dynamicPopulate;
    } else if (isRelationAttribute(attribute)) {
      const relationPopulate = getPopulateFromSchema(attribute.target, deepness - 1);
      if (relationPopulate) {
        populate[attributeName] = relationPopulate;
      }
    } else if (isMediaAttribute(attribute)) {
      populate[attributeName] = true;
    }
  }

  return isEmpty(populate) ? true : { populate };
}

function buildSlugHierarchy(slug, deepness = 5) {
  slug = CustomSlugToSlug[slug] || slug;

  if (deepness <= 1) {
    return { __slug: slug };
  }

  const hierarchy = {
    __slug: slug,
  };

  const model = getModel(slug);
  for (const [attributeName, attribute] of Object.entries(getModelPopulationAttributes(model))) {
    if (!attribute) {
      continue;
    }

    if (isComponentAttribute(attribute)) {
      hierarchy[attributeName] = buildSlugHierarchy(attribute.component, deepness - 1);
    } else if (isDynamicZoneAttribute(attribute)) {
      hierarchy[attributeName] = Object.fromEntries(attribute.components.map((componentSlug) => [componentSlug, buildSlugHierarchy(componentSlug, deepness - 1)]));
    } else if (isRelationAttribute(attribute)) {
      const relationHierarchy = buildSlugHierarchy(attribute.target, deepness - 1);
      if (relationHierarchy) {
        hierarchy[attributeName] = relationHierarchy;
      }
    } else if (isMediaAttribute(attribute)) {
      hierarchy[attributeName] = buildSlugHierarchy(CustomSlugs.MEDIA, deepness - 1);
    }
  }

  return hierarchy;
}

function getModelPopulationAttributes(model) {
  if (model.uid === 'plugin::upload.file') {
    const { related, ...attributes } = model.attributes;
    return attributes;
  }

  return model.attributes;
}

export {
  exportDataV2,
  findEntriesForHierarchy,
  findEntries,
  buildFilterQuery,
  convertData,
  getConverter,
  getPopulateFromSchema,
  buildSlugHierarchy,
  getModelPopulationAttributes,
};