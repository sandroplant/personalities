import { fileURLToPath } from 'url';
import { dirname } from 'path';

// For TypeScript and Webpack compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export { __filename, __dirname };
