import { CustomSlugs } from '../../../config/constants.js';
import { getAllSlugs } from '../../../utils/models.js';
import { getService } from '../../../utils/utils.js';

export default ({ strapi }) => importData;

async function importData(ctx) {
  if (!hasPermissions(ctx)) {
    return ctx.forbidden();
  }

  const { user } = ctx.state;
  const { data } = ctx.request.body;
  const {slug, data:dataRaw, format, idField} = data
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
}

function hasPermissions(ctx) {
  const { data } = ctx.request.body;
  const {slug } = data
  const { userAbility } = ctx.state;

  let slugsToCheck = [];
  if (slug === CustomSlugs.WHOLE_DB) {
    slugsToCheck.push(...getAllSlugs());
  } else {
    slugsToCheck.push(slug);
  }

  return slugsToCheck.every((slug) => hasPermissionForSlug(userAbility, slug));
}

function hasPermissionForSlug(userAbility, slug) {
  
  const permissionChecker = strapi.plugin('content-manager').service('permission-checker').create({ userAbility, model: slug });

  return permissionChecker.can.create() && permissionChecker.can.update();
}
