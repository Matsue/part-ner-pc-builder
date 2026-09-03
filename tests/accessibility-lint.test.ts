import assert from 'node:assert/strict';
import test from 'node:test';
import { lintClassNames } from '../scripts/lint-accessibility.ts';

test('design lint rejects tiny type, dim text, and truncation but accepts accessible tokens', () => {
  for (const value of ['text-[8px]', 'text-[0.6rem]', 'text-zinc-500', 'hover:text-zinc-600', 'truncate', 'line-clamp-2']) {
    assert.ok(lintClassNames(value).length, value);
  }
  assert.deepEqual(lintClassNames('text-caption text-muted-foreground text-[1rem] break-words'), []);
});
