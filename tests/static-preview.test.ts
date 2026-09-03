import assert from 'node:assert/strict';
import test from 'node:test';

import viteConfig from '../vite.config.ts';

test('static preview serves exported files without SSR or deployment plugins', () => {
  const config = viteConfig({
    command: 'serve',
    mode: 'production',
    isPreview: true,
  });

  assert.deepEqual(config.plugins, []);
});
