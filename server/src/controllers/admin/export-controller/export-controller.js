import { CustomSlugs } from '../../../config/constants.js';
import { getService } from '../../../utils/utils.js';
import { getAllSlugs } from '../../../utils/models.js';
import { handleAsyncError } from '../../content-api/utils.js';

const exportData = async (ctx) => {
  if (!hasPermissions(ctx)) {
    return ctx.forbidden();
  }

  // let { slug, search, applySearch, exportFormat, relationsAsId, deepness = 5, exportPluginsContentTypes } = ctx.request.body;

  // let data;
  let data;
  const { data: dataRaw } = ctx.request.body;
  const { slug, search, applySearch, exportFormat, relationsAsId, deepness = 5, exportPluginsContentTypes } = dataRaw;
  if (exportFormat === getService('export').formats.JSON_V2) {
    data = await getService('export').exportDataV2({ slug, search, applySearch, deepness, exportPluginsContentTypes });
  } else {
    data = await getService('export').exportData({ slug, search, applySearch, exportFormat, relationsAsId, deepness });
  }

  ctx.body = {
    data,
  };
};

const hasPermissions = (ctx) => {
  const { data } = ctx.request.body;
  const {slug } = data
  const { userAbility } = ctx.state;

  const slugs = slug === CustomSlugs.WHOLE_DB ? getAllSlugs() : [slug];

  const allowedSlugs = slugs.filter((slug) => {
    const permissionChecker = strapi.plugin('content-manager').service('permission-checker').create({ userAbility, model: slug });
    return permissionChecker.can.read();
  });

  return !!allowedSlugs.length;
};

export default ({ strapi }) => ({
  exportData: handleAsyncError(exportData),
});
