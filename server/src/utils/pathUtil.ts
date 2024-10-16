// server/src/utils/pathUtil.ts

import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Convert import.meta.url to a file path
export const __filename = fileURLToPath(import.meta.url);

// Get the directory name of the current module
export const __dirname = dirname(__filename);
