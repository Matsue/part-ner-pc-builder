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
    () => store.getState().applyPreview(preview.id),
    (error: unknown) =>
      error instanceof Error && error.message === 'PREVIEW_EXPIRED',
  );
});
