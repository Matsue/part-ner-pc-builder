import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hosting = JSON.parse(readFileSync(resolve(root, '.openai/hosting.json'), 'utf8'));
const output = resolve(root, hosting.static.directory);
const entry = resolve(output, 'index.html');

assert.ok(existsSync(entry), 'Static export is missing index.html; the home route may have been skipped.');
const html = readFileSync(entry, 'utf8');
assert.match(html, /data-slot="button"/, 'Static export must include the rendered product UI.');

const assetPaths = new Set(
  [...html.matchAll(/\b(?:src|href)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)]
    .map((match) => match[1])
    .filter((path) => path !== '/' && !path.startsWith('//')),
);
assert.ok([...assetPaths].some((path) => path.endsWith('.js')), 'Static export must include client scripts.');
for (const assetPath of assetPaths) {
  const file = resolve(output, `.${decodeURIComponent(assetPath)}`);
  assert.ok(file.startsWith(output + sep), `Asset path escapes the public output: ${assetPath}`);
  assert.ok(existsSync(file), `Static export references a missing asset: ${assetPath}`);
}

console.log(`Static export verified: home page and ${assetPaths.size} local assets.`);
