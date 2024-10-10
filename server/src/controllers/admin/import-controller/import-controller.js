import getModelAttributesFunc from './get-model-attributes.js';
import importDataFunc from './import-data.js';

const importController = ({ strapi }) => ({
  getModelAttributes: getModelAttributesFunc({ strapi }),
  importData: importDataFunc({ strapi }),
});

export default importController;
