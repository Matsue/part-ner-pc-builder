import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('WebMCP debug panel is anchored to the bottom right and fits narrow screens', () => {
  const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const panel = css.match(/\.debug-panel\s*\{([^}]+)\}/)?.[1];
  assert.ok(panel, 'Debug panel styles must exist');
  assert.match(panel, /\bposition:\s*fixed\s*;/);
  assert.match(panel, /\bbottom:\s*16px\s*;/);
  assert.match(panel, /\bright:\s*16px\s*;/);
  assert.doesNotMatch(panel, /\bleft\s*:/);
  assert.match(panel, /width:\s*min\(24rem,\s*calc\(100vw - 32px\)\)/);
});
