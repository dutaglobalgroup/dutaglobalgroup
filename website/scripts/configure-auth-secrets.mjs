import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { productionConfig, verifyBuiltConfig } from './production-config.mjs';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!url || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) || /YOUR_PROJECT/i.test(url)) {
  throw new Error('SUPABASE_URL belum diisi dengan proyek autentikasi produksi.');
}
if (!key || key.length < 30 || /YOUR_|placeholder/i.test(key)) {
  throw new Error('SUPABASE_PUBLISHABLE_KEY belum diisi.');
}
if (key.startsWith('sb_secret_')) throw new Error('Gunakan publishable key, bukan secret/service-role key.');
if (key.startsWith('eyJ')) {
  let payload;
  try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); } catch { throw new Error('Format anon key tidak valid.'); }
  if (payload.role !== 'anon') throw new Error('Gunakan anon/publishable key, bukan service-role key.');
} else if (!key.startsWith('sb_publishable_')) {
  throw new Error('Format publishable key tidak dikenal.');
}
if (process.argv.includes('--check')) {
  console.log('Konfigurasi autentikasi tersedia; nilainya tidak ditampilkan.');
} else {
  verifyBuiltConfig(JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8')), productionConfig());
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'secret', 'bulk', '--config', 'dist/server/wrangler.json'], {
    input: JSON.stringify({ SUPABASE_URL: url, SUPABASE_PUBLISHABLE_KEY: key }),
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
