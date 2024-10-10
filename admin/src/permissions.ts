import { PLUGIN_ID } from './pluginId';

interface Permission {
  action: string;
  subject: null;
}

interface PluginPermissions {
  exportButton: Permission[];
  importButton: Permission[];
  main: Permission[];
}

export const pluginPermissions: PluginPermissions = {
  exportButton: [{ action: `plugin::${PLUGIN_ID}.export`, subject: null }],
  importButton: [{ action: `plugin::${PLUGIN_ID}.import`, subject: null }],
  main: [
    { action: `plugin::${PLUGIN_ID}.export`, subject: null },
    { action: `plugin::${PLUGIN_ID}.import`, subject: null },
  ],
};
