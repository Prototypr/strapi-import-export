import importData from './import-data.js';

export default ({ strapi }) => ({
  importData: importData({ strapi }),
});
