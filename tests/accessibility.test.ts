import assert from 'node:assert/strict';
import test from 'node:test';

import { describeBuildUpdate } from '../lib/accessibility/build-announcements.ts';
import { createBuildStore } from '../lib/store/build-store.ts';
import { createWebMcpTools } from '../lib/webmcp/tools.ts';

const options = { signal: new AbortController().signal };

test('announces three CPU candidates without claiming the build was changed', async () => {
  const store = createBuildStore();
  const before = store.getState();
  const tool = createWebMcpTools(store).find((item) => item.name === 'recommend_products')!;
  await tool.execute({ category: 'cpu' }, options);
  assert.equal(describeBuildUpdate(before, store.getState()), '3 CPU options displayed. Your build has not changed.');
});

test('announces selections, budget, and compatibility including preview expiry', () => {
  const store = createBuildStore();
  store.getState().selectProduct('mb-05');
  store.getState().previewChanges({ basedOnBuildVersion: 1, changes: { cpu: 'cpu-04' } });
  const before = store.getState();
  store.getState().selectProduct('cpu-01');
  const message = describeBuildUpdate(before, store.getState());
  assert.match(message, /CorePeak A6-65/);
  assert.match(message, /Build total: \$/);
  assert.match(message, /remaining/);
  assert.match(message, /Compatibility issue/);
  assert.match(message, /preview is out of date/);
});

test('preview creation, approval, dismissal, and reset have distinct announcements', () => {
  const store = createBuildStore();
  const initial = store.getState();
  const preview = initial.previewChanges({ basedOnBuildVersion: 0, changes: { cpu: 'cpu-01' } });
  const pending = store.getState();
  assert.match(describeBuildUpdate(initial, pending), /Preview ready.*not applied/);
  pending.applyPreview(preview.id, 'human');
  const applied = store.getState();
  assert.match(describeBuildUpdate(pending, applied), /Preview applied/);
  applied.previewChanges({ basedOnBuildVersion: 1, changes: { cpu: 'cpu-02' } });
  const next = store.getState();
  next.dismissPreview();
  assert.equal(describeBuildUpdate(next, store.getState()), 'Preview dismissed. Your build has not changed.');
  const beforeReset = store.getState();
  beforeReset.clearBuild();
  assert.match(describeBuildUpdate(beforeReset, store.getState()), /Build reset/);
});

test('goal changes report the current budget while category navigation stays quiet', () => {
  const store = createBuildStore();
  const initial = store.getState();
  initial.setActiveCategory('cpu');
  assert.equal(describeBuildUpdate(initial, store.getState()), '');
  const before = store.getState();
  before.setGoal({ budgetUsd: 300 });
  assert.match(describeBuildUpdate(before, store.getState()), /Goals updated.*Budget: \$300.00/);
});
