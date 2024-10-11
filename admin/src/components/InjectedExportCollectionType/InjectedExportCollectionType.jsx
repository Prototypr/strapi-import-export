import React from 'react';

import { ExportModal } from '../ExportModal/ExportModal';

export const InjectedExportCollectionType = () => {
  return <ExportModal unavailableOptions={['exportPluginsContentTypes']} />;
};
