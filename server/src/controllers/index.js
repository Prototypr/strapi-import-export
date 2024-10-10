import exportAdminController from './admin/export-controller';
import importAdminController from './admin/import-controller';
import exportContentApiController from './content-api/export-controller';
import importContentApiController from './content-api/import-controller';

const controllers = {
  exportAdmin: exportAdminController,
  importAdmin: importAdminController,
  export: exportContentApiController,
  import: importContentApiController,
};

export default controllers;

export {
  exportAdminController as exportAdmin,
  importAdminController as importAdmin,
  exportContentApiController as export,
  importContentApiController as import,
};