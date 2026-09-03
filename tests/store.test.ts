import assert from 'node:assert/strict';
import test from 'node:test';

import { productsById } from '../lib/domain/data.ts';
import { createBuildStore } from '../lib/store/build-store.ts';

test('human and agent changes increment one shared version', () => {
  const store = createBuildStore();
  assert.equal(store.getState().version, 0);

  store.getState().selectProduct('case-01', 'human');
  assert.equal(store.getState().version, 1);
  store.getState().setGoal({ theme: 'white' }, 'agent');
  assert.equal(store.getState().version, 2);
});

test('rejects recommendations based on stale state', () => {
  const store = createBuildStore();
  store.getState().selectProduct('case-01', 'human');

  assert.throws(
    () =>
      store.getState().showCandidates({
        basedOnBuildVersion: 0,
        category: 'gpu',
        title: 'GPU picks',
        candidates: [{ productId: 'gpu-02', angle: 'AESTHETICS', reason: 'White build' }],
      }),
    (error: unknown) =>
      error instanceof Error && error.message === 'STALE_BUILD_STATE',
  );
});

test('preview is applied once and expires after a human change', () => {
  const store = createBuildStore();
  store.getState().selectProduct('case-01', 'human');
  const preview = store.getState().previewChanges({
    basedOnBuildVersion: 1,
    changes: { motherboard: 'mb-02', psu: 'psu-04' },
  });

  assert.equal(preview.after.motherboard?.id, productsById['mb-02'].id);
  store.getState().selectProduct('gpu-02', 'human');
  assert.throws(
    () => store.getState().applyPreview(preview.id, 'human'),
    (error: unknown) =>
      error instanceof Error && error.message === 'PREVIEW_EXPIRED',
  );
});

test('agents cannot select parts or apply a preview without the human UI', () => {
  const store = createBuildStore();
  const before = store.getState();
  assert.throws(() => store.getState().selectProduct('cpu-01', 'agent'), /HUMAN_APPROVAL_REQUIRED/);
  assert.equal(store.getState(), before);
  const preview = store.getState().previewChanges({ basedOnBuildVersion: 0, changes: { cpu: 'cpu-01' } });
  const pending = store.getState();
  assert.throws(() => pending.applyPreview(preview.id), /HUMAN_APPROVAL_REQUIRED/);
  assert.throws(() => pending.applyPreview(preview.id, 'agent'), /HUMAN_APPROVAL_REQUIRED/);
  assert.equal(store.getState(), pending);
  pending.applyPreview(preview.id, 'human');
  assert.throws(() => store.getState().applyPreview(preview.id, 'human'), /PREVIEW_NOT_FOUND/);
});

test('dismissed, superseded, reset, and goal-stale previews cannot be approved', () => {
  for (const invalidate of ['dismiss', 'replace', 'reset', 'goal']) {
    const store = createBuildStore();
    const preview = store.getState().previewChanges({ basedOnBuildVersion: 0, changes: { cpu: 'cpu-01' } });
    if (invalidate === 'dismiss') store.getState().dismissPreview();
    if (invalidate === 'replace') store.getState().previewChanges({ basedOnBuildVersion: 0, changes: { cpu: 'cpu-02' } });
    if (invalidate === 'reset') store.getState().clearBuild();
    if (invalidate === 'goal') store.getState().setGoal({ budgetUsd: 1000 });
    const before = store.getState();
    assert.throws(() => before.applyPreview(preview.id, 'human'), /PREVIEW_NOT_FOUND|PREVIEW_EXPIRED/);
    assert.equal(store.getState(), before);
  }
});
