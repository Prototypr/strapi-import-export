import Joi from 'joi';
import { InputFormats } from '../../../services/import/parsers.js';
import { getService } from '../../../utils/utils.js';
import { checkParams, handleAsyncError } from '../utils.js';

const bodySchema = Joi.object({
  slug: Joi.string().required(),
  data: Joi.any().required(),
  format: Joi.string()
    .valid(...InputFormats)
    .required(),
  idField: Joi.string(),
});

const importData = async (ctx) => {
  const { user } = ctx.state;

  const { slug, data: dataRaw, format, idField } = checkParams(bodySchema, ctx.request.body);

  const fileContent = await getService('import').parseInputData(format, dataRaw, { slug });

  let res;
  if (fileContent?.version === 2) {
    res = await getService('import').importDataV2(fileContent, {
      slug,
      user,
      idField,
    });
  } else {
    res = await getService('import').importData(dataRaw, {
      slug,
      format,
      user,
      idField,
    });
  }

  ctx.body = {
    failures: res.failures,
  };
};

export default ({ strapi }) => handleAsyncError(importData);
