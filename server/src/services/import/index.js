import { importData } from './import.js';
import { importDataV2 } from './import-v2.js';
import { parseInputData } from './parsers.js';

const importService = {
  importData,
  importDataV2,
  parseInputData,
};

export default importService;
