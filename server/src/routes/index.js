import exportAdminRoutes from './export-admin.js';
import importAdminRoutes from './import-admin.js';
import exportContentApiRoutes from './export-content-api.js';
import importContentApiRoutes from './import-content-api.js';

export default {
  exportAdminRoutes,
  importAdminRoutes,
  export: exportContentApiRoutes,
  import: importContentApiRoutes,
};
