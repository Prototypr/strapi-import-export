import csvtojson from 'csvtojson';
import { isArraySafe } from '../../../libs/arrays.js';
import { isObjectSafe } from '../../../libs/objects.js';
import { getModelAttributes } from '../../utils/models.js';
// import { EnumValues } from '../../../types.js';
// import { SchemaUID } from '../../types.js';

const inputFormatToParser = {
  csv: parseCsv,
  jso: parseJso,
  json: parseJson,
};

const InputFormats = Object.keys(inputFormatToParser);

/**
 * Parse input data.
 */
async function parseInputData(format, dataRaw, { slug }) {
  const parser = inputFormatToParser[format];
  if (!parser) {
    throw new Error(`Data input format ${format} is not supported.`);
  }

  const data = await parser(dataRaw, { slug });
  return data;
}

async function parseCsv(dataRaw, { slug }) {
  let data = await csvtojson().fromString(dataRaw);

  const relationNames = getModelAttributes(slug, { filterType: ['component', 'dynamiczone', 'media', 'relation'] }).map((a) => a.name);
  data = data.map((datum) => {
    for (let name of relationNames) {
      try {
        datum[name] = JSON.parse(datum[name]);
      } catch (err) {
        strapi.log.error(err);
      }
    }
    return datum;
  });

  return data;
}

async function parseJson(dataRaw) {
  let data = JSON.parse(dataRaw);
  return data;
}

async function parseJso(dataRaw) {
  if (!isObjectSafe(dataRaw) && !isArraySafe(dataRaw)) {
    throw new Error(`To import JSO, data must be an array or an object`);
  }

  return dataRaw;
}

export { InputFormats, parseInputData };
