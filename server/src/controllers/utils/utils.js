import pluginId from '../../utils/pluginId.js';

/**
 * ServiceName.
 * @typedef {("export"|"import")} ServiceName
 */

/**
 * Get a plugin service.
 * @param {ServiceName} serviceName
 * @returns {Object} The requested plugin service
 */
const getService = (serviceName) => {
  return strapi.plugin(pluginId).service(serviceName);
};

export { getService };
