import { readFileSync } from 'node:fs';
import { productionConfig, verifyBuiltConfig } from './production-config.mjs';
const config = productionConfig();
if (process.argv.includes('--built')) {
  verifyBuiltConfig(JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8')), config);
}
console.log('Konfigurasi produksi valid; database dan bucket ditentukan secara eksplisit.');
