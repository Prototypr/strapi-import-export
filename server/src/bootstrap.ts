import type { Core } from '@strapi/strapi';
import {PLUGIN_ID} from '../../admin/src/pluginId';

const actions = [
  {
    section: 'plugins',
    displayName: 'Import',
    uid: 'import',
    pluginName: PLUGIN_ID,
  },
  {
    section: 'plugins',
    displayName: 'Export',
    uid: 'export',
    pluginName: PLUGIN_ID,
  },
];

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  
  strapi.admin.services.permission.actionProvider.registerMany(actions);
  // bootstrap phase
};

export default bootstrap;