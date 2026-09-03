import assert from 'node:assert/strict';
import test from 'node:test';

import { baseToolNames, createWebMcpTools } from '../lib/webmcp/tools.ts';
import { categories } from '../lib/domain/types.ts';
import { productsById } from '../lib/domain/data.ts';
import { createBuildStore } from '../lib/store/build-store.ts';

const options = { signal: new AbortController().signal };

type RecommendationResult = {
  displayed: boolean;
  count: number;
  currency: string;
  buildChanged: boolean;
  basedOnBuildVersion: number;
  productIds: string[];
  missingCategories: string[];
  notes: string[];
};

test('exposes recommendations and previews, but no agent apply action', () => {
  const tools = createWebMcpTools(createBuildStore());
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'get_current_build',
      'set_build_goal',
      'recommend_products',
      'find_products',
      'show_product_candidates',
      'preview_build_changes',
    ],
  );
  assert.equal(tools[0]?.annotations?.readOnlyHint, true);
  assert.equal(tools[1]?.annotations?.readOnlyHint, false);
  assert.deepEqual(tools.map((tool) => tool.name), [...baseToolNames]);
  assert.equal(tools.find((tool) => tool.name === 'find_products')?.annotations?.readOnlyHint, true);
  assert.equal(tools.find((tool) => tool.name === 'recommend_products')?.annotations?.readOnlyHint, false);
});

function recommendationTools() {
  const store = createBuildStore();
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));
  return { store, tools };
}

test('CPU follow-up displays three options in one call, without adding or previewing a part', async () => {
  const { store, tools } = recommendationTools();
  store.getState().selectProduct('case-01');
  store.getState().selectProduct('gpu-02');
  const before = store.getState();
  const result = await tools.recommend_products.execute({ category: 'cpu' }, options) as RecommendationResult;
  assert.equal(result.displayed, true);
  assert.equal(result.count, 3);
  assert.equal(result.currency, 'USD');
  assert.equal(result.buildChanged, false);
  assert.equal(store.getState().activeCategory, 'cpu');
  assert.equal(store.getState().recommendation?.candidates.length, 3);
  assert.equal(store.getState().recommendation?.candidates[0].productId, 'cpu-01');
  assert.deepEqual(result.productIds, store.getState().recommendation?.candidates.map((item) => item.productId));
  assert.equal(store.getState().selected, before.selected);
  assert.equal(store.getState().goal, before.goal);
  assert.equal(store.getState().version, before.version);
  assert.equal(store.getState().preview, null);
  assert.deepEqual(result.missingCategories, ['cpu', 'motherboard', 'psu']);
  assert.match(result.notes.join(' '), /GPU-based/);
});

test('recommendations replace the previous category and use the latest human-selected motherboard', async () => {
  const { store, tools } = recommendationTools();
  await tools.recommend_products.execute({ category: 'gpu' }, options);
  store.getState().selectProduct('mb-02');
  await tools.recommend_products.execute({ category: 'cpu' }, options);
  assert.deepEqual(store.getState().recommendation?.candidates.map((item) => item.productId), ['cpu-01', 'cpu-02', 'cpu-03']);
  store.getState().selectProduct('mb-05');
  const result = await tools.recommend_products.execute({ category: 'cpu' }, options) as RecommendationResult;
  assert.equal(result.basedOnBuildVersion, 2);
  assert.equal(store.getState().recommendation?.basedOnBuildVersion, 2);
  for (const item of store.getState().recommendation!.candidates) {
    const product = productsById[item.productId];
    assert.equal(product.category === 'cpu' && product.socket, 'O1');
  }
});

test('recommendation action covers all part categories and accepts an explicit smaller count', async () => {
  const { store, tools } = recommendationTools();
  for (const category of categories) {
    const result = await tools.recommend_products.execute({ category }, options) as RecommendationResult;
    assert.equal(result.count, 3);
    assert.equal(new Set(result.productIds).size, 3);
    assert.ok(result.productIds.every((id: string) => productsById[id].category === category));
    assert.equal(store.getState().activeCategory, category);
  }
  const result = await tools.recommend_products.execute({ category: 'cpu', count: 2 }, options) as RecommendationResult;
  assert.equal(result.count, 2);
});

test('recommendations validate inputs before changing visible state', async () => {
  const { store, tools } = recommendationTools();
  await tools.recommend_products.execute({ category: 'cpu' }, options);
  const before = store.getState();
  for (const input of [null, {}, { category: 'ram' }, { category: 'cpu', count: 0 }, { category: 'cpu', count: 4 }, { category: 'cpu', count: 1.5 }, { category: 'cpu', count: '3' }, { category: 'cpu', count: NaN }, { category: 'cpu', productId: 'cpu-03' }]) {
    assert.throws(() => tools.recommend_products.execute(input as Record<string, unknown>, options), /INVALID/);
    assert.equal(store.getState(), before);
  }
});

test('read-only product search never changes candidates or the selected build', async () => {
  const { store, tools } = recommendationTools();
  await tools.recommend_products.execute({ category: 'cpu' }, options);
  const before = store.getState();
  await tools.find_products.execute({ category: 'gpu' }, options);
  assert.equal(store.getState(), before);
  assert.match(tools.find_products.description, /recommend_products/);
  assert.match(tools.recommend_products.description, /CPUはどれがいい/);
  assert.match(tools.recommend_products.description, /Which CPU/);
});

test('agent tools read and update the same store used by the human UI', async () => {
  const store = createBuildStore();
  store.getState().selectProduct('case-01', 'human');
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));

  const initial = await tools.get_current_build.execute({}, options) as { buildVersion: number; selectedProducts: { case: { id: string } } };
  assert.equal(initial.buildVersion, 1);
  assert.equal(initial.selectedProducts.case.id, 'case-01');

  await tools.show_product_candidates.execute({
    basedOnBuildVersion: 1,
    category: 'gpu',
    title: 'Three GPU paths',
    candidates: [
      { productId: 'gpu-05', angle: 'BEST BALANCE', reason: 'Most performance per dollar.' },
      { productId: 'gpu-02', angle: 'WHITE BUILD', reason: 'Matches the chosen case.' },
      { productId: 'gpu-01', angle: 'BUDGET', reason: 'Leaves room for other parts.' },
    ],
  }, options);
  assert.equal(store.getState().recommendation?.candidates[1]?.productId, 'gpu-02');
});

test('finishing the demo build stages changes and waits for in-page approval', async () => {
  const { store, tools } = recommendationTools();
  for (const id of ['case-01', 'gpu-02', 'cpu-01']) store.getState().selectProduct(id);
  await tools.set_build_goal.execute({ budgetUsd: 2000, theme: 'white' }, options);
  const before = store.getState();
  const preview = await tools.preview_build_changes.execute({
    basedOnBuildVersion: before.version,
    changes: { motherboard: 'mb-02', psu: 'psu-04' },
  }, options) as { previewId: string; applied: boolean; requiresHumanApproval: boolean; nextStep: string; totalUsd: number };
  assert.equal(store.getState().selected, before.selected);
  assert.equal(store.getState().version, before.version);
  assert.equal(preview.applied, false);
  assert.equal(preview.requiresHumanApproval, true);
  assert.equal(preview.totalUsd, 1970);
  assert.match(preview.nextStep, /Approve & apply preview/);
  assert.ok(!createWebMcpTools(store).some((tool) => tool.name === 'apply_build_changes'));
  const snapshot = await tools.get_current_build.execute({}, options) as {
    pendingPreview: { previewId: string; status: string } | null;
  };
  assert.equal(snapshot.pendingPreview?.previewId, preview.previewId);
  assert.equal(snapshot.pendingPreview?.status, 'awaiting_human_approval');
  // A legacy/cached apply callback must fail even if it has the preview ID.
  assert.throws(() => store.getState().applyPreview(preview.previewId, 'agent'), /HUMAN_APPROVAL_REQUIRED/);
  assert.equal(store.getState().selected, before.selected);
  store.getState().applyPreview(preview.previewId, 'human');
  assert.equal(store.getState().selected.motherboard?.id, 'mb-02');
  assert.equal(store.getState().selected.psu?.id, 'psu-04');
  assert.equal(store.getState().version, before.version + 1);
  assert.equal(store.getState().preview, null);
});

test('in-page approval preserves stale-preview protection', async () => {
  const store = createBuildStore();
  store.getState().selectProduct('case-01', 'human');
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));
  const preview = await tools.preview_build_changes.execute({
    basedOnBuildVersion: 1,
    changes: { motherboard: 'mb-02', psu: 'psu-04' },
  }, options) as { previewId: string };

  store.getState().selectProduct('gpu-02', 'human');
  assert.throws(
    () => store.getState().applyPreview(preview.previewId, 'human'),
    (error: unknown) => error instanceof Error && error.message === 'PREVIEW_EXPIRED',
  );
});
