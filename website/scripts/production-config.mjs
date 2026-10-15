import { resolve } from 'node:path';

// Called only for an explicitly selected standalone Cloudflare build.
// Never fall back to development storage when production values are missing.
export function productionConfig(values = process.env, root = process.cwd()) {
  const required = (key, pattern) => {
    const value = values[key]?.trim();
    if (!value || !pattern.test(value) || /placeholder|your[_-]|site-creator/i.test(value)) {
      throw new Error(`Konfigurasi produksi ${key} belum valid.`);
    }
    return value;
  };
  const name = required('DGG_WORKER_NAME', /^[a-z][a-z0-9-]{2,62}$/);
  const databaseId = required('DGG_D1_DATABASE_ID', /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i);
  if (/^00000000-0000-/.test(databaseId)) throw new Error('Database lokal tidak boleh digunakan untuk produksi.');
  const databaseName = required('DGG_D1_DATABASE_NAME', /^[a-zA-Z0-9_-]{3,64}$/);
  const bucketName = required('DGG_R2_BUCKET_NAME', /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/);
  return {
    name,
    compatibility_date: '2026-05-15',
    workers_dev: true,
    preview_urls: false,
    d1_databases: [{ binding: 'DB', database_name: databaseName, database_id: databaseId, migrations_dir: resolve(root, 'drizzle') }],
    r2_buckets: [{ binding: 'BUCKET', bucket_name: bucketName }],
  };
}

export function verifyBuiltConfig(config, expected) {
  if (config.name !== expected.name || !config.main) throw new Error('Hasil build bukan Worker produksi yang dipilih.');
  const db = config.d1_databases?.find(x => x.binding === 'DB');
  const bucket = config.r2_buckets?.find(x => x.binding === 'BUCKET');
  if (db?.database_id !== expected.d1_databases[0].database_id || bucket?.bucket_name !== expected.r2_buckets[0].bucket_name) {
    throw new Error('Binding database atau foto hasil build tidak cocok.');
  }
  if (config.services?.length) throw new Error('Binding layanan preview tidak boleh masuk deployment produksi.');
}
