import { getTranslation } from './utils/getTranslation';
import { PLUGIN_ID } from './pluginId';
import { Initializer } from './components/Initializer';
import { PluginIcon } from './components/PluginIcon';
import {pluginPermissions} from './permissions';
// @ts-ignore
import { Alerts } from './components/Injected/Alerts/Alerts';
// @ts-ignore
import { ImportModal } from './components/ImportModal/ImportModal';
import translations from './translations'; 

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.plugin.name`,
        defaultMessage:'Import Export',
      },
      permissions: pluginPermissions.main,
      Component: async () => {
        const { App } = await import('./pages/App');

        return App;
      },
    });

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app:any) {
    // app.injectContentManagerComponent('listView', 'actions', {
    //   name: `${PLUGIN_ID}-alerts`,
    //   Component: Alerts,
    // });
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: `${PLUGIN_ID}-alerts`,
      Component: Alerts,
    });
    // app.injectContentManagerComponent('listView', 'actions', {
    //   name: `${pluginId}-import`,
    //   Component: ImportButton,
    // });
    app.getPlugin('content-manager').injectComponent('listView', 'actions', {
      name: `${PLUGIN_ID}-import`,
      Component: ImportModal,
    });
    // app.injectContentManagerComponent('listView', 'actions', {
    //   name: `${pluginId}-export`,
    //   Component: InjectedExportCollectionType,
    // });

    // app.injectContentManagerComponent('editView', 'right-links', {
    //   name: `${pluginId}-alerts`,
    //   Component: Alerts,
    // });
    // app.injectContentManagerComponent('editView', 'right-links', {
    //   name: `${pluginId}-import-export`,
    //   Component: InjectedImportExportSingleType,
    // });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTranslations = [
      {
        data: translations.en,
        locale: 'en'
      },
      {
        data: translations.uk,
        locale: 'uk'
      }
    ];

    return importedTranslations;
  },

  // async registerTrads(app: any) {
  //   const { locales } = app;

  //   const importedTranslations = await Promise.all(
  //     (locales as string[]).map((locale) => {
  //       return import(`./translations/${locale}.json`)
  //         .then(({ default: data }) => {
  //           return {
  //             data: getTranslation(data),
  //             locale,
  //           };
  //         })
  //         .catch(() => {
  //           return {
  //             data: {},
  //             locale,
  //           };
  //         });
  //     })
  //   );

  //   return importedTranslations;
  // },
};
