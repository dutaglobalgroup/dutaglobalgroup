import test from 'node:test';
import assert from 'node:assert/strict';
import { productionConfig, verifyBuiltConfig } from '../scripts/production-config.mjs';
const values = { DGG_WORKER_NAME: 'duta-monitor', DGG_D1_DATABASE_NAME: 'duta-data', DGG_D1_DATABASE_ID: '12345678-abcd-4321-abcd-123456789abc', DGG_R2_BUCKET_NAME: 'duta-photos' };
test('production cannot use missing or local placeholder storage', () => {
  for (const key of Object.keys(values)) {
    assert.throws(() => productionConfig({ ...values, [key]: '' }));
  }
  assert.throws(() => productionConfig({ ...values, DGG_D1_DATABASE_ID: '00000000-0000-4000-8000-000000000000' }));
});
test('build must match selected database and bucket and exclude preview services', () => {
  const expected = productionConfig(values, '/example');
  const built = { ...expected, main: 'index.js' };
  assert.doesNotThrow(() => verifyBuiltConfig(built, expected));
  assert.equal(expected.d1_databases[0].migrations_dir, '/example/drizzle');
  for (const override of [ { name: 'other-site' }, { main: '' }, { d1_databases: [] }, { r2_buckets: [] }, { services: [{ binding: 'CONNECTORS' }] } ]) {
    assert.throws(() => verifyBuiltConfig({ ...built, ...override }, expected));
  }
});
