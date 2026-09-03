import assert from 'node:assert/strict';
import test from 'node:test';

import { productsById } from '../lib/domain/data.ts';
import { describeCandidateTradeoffs } from '../lib/domain/tradeoffs.ts';
import { createBuildStore } from '../lib/store/build-store.ts';
import { createWebMcpTools, currentBuildSnapshot } from '../lib/webmcp/tools.ts';

const options = { signal: new AbortController().signal };
function setup() {
  const store = createBuildStore();
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));
  return { store, tools };
}

test('white case alone does not imply a white theme; value GPU leads the demo shortlist', async () => {
  const { store, tools } = setup();
  store.getState().selectProduct('case-01');
  await tools.set_build_goal.execute({ budgetUsd: 2000 }, options);
  const before = store.getState();
  await tools.recommend_products.execute({ category: 'gpu' }, options);
  const candidates = store.getState().recommendation!.candidates;
  assert.equal(store.getState().goal.theme, 'any');
  assert.deepEqual(candidates.map((item) => item.productId), ['gpu-05', 'gpu-02', 'gpu-06']);
  assert.equal(candidates[0].angle, 'BEST BALANCE');
  assert.equal(candidates[1].angle, 'AESTHETICS');
  assert.equal(candidates[2].angle, 'PERFORMANCE');
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
  assert.equal(store.getState().selected, before.selected);
  assert.equal(store.getState().version, before.version);
});

test('manual white GPU selection creates a tentative preference, not a new stated goal', async () => {
  const { store, tools } = setup();
  store.getState().selectProduct('case-01');
  store.getState().selectProduct('gpu-02');
  const snapshot = currentBuildSnapshot(store);
  assert.deepEqual(snapshot.colorPreference, {
    theme: 'white', source: 'inferred', evidenceProductIds: ['case-01', 'gpu-02'],
  });
  assert.equal(snapshot.goal.theme, 'any');
  await tools.recommend_products.execute({ category: 'cpu' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'cpu-01');
  await tools.recommend_products.execute({ category: 'motherboard' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'mb-02');
});

test('agent-selected parts, mixed colors, previews, and resets cannot invent a human preference', () => {
  const { store } = setup();
  store.getState().selectProduct('case-01');
  const preview = store.getState().previewChanges({ basedOnBuildVersion: 1, changes: { gpu: 'gpu-02' } });
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
  store.getState().applyPreview(preview.id, 'agent');
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
  store.getState().selectProduct('gpu-02', 'human');
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'inferred');
  store.getState().selectProduct('gpu-05', 'human');
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
  store.getState().selectProduct('gpu-02');
  store.getState().clearBuild();
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
});

test('approving an agent-authored preview does not count as a manual style choice', () => {
  const { store } = setup();
  const preview = store.getState().previewChanges({ basedOnBuildVersion: 0, changes: { case: 'case-01', gpu: 'gpu-02' } });
  store.getState().applyPreview(preview.id, 'human');
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'unspecified');
});

test('explicit color preference or explicit any-color overrides the inferred hint', async () => {
  const { store, tools } = setup();
  store.getState().selectProduct('case-01');
  store.getState().selectProduct('gpu-02');
  await tools.set_build_goal.execute({ theme: 'any' }, options);
  assert.equal(currentBuildSnapshot(store).colorPreference.source, 'explicit');
  await tools.recommend_products.execute({ category: 'motherboard' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'mb-01');
  await tools.set_build_goal.execute({ theme: 'white' }, options);
  await tools.recommend_products.execute({ category: 'gpu' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'gpu-02');
});

test('tentative color matching never outranks compatibility or the budget', async () => {
  const { store, tools } = setup();
  store.getState().selectProduct('case-01');
  store.getState().selectProduct('gpu-02');
  store.getState().selectProduct('cpu-04');
  await tools.recommend_products.execute({ category: 'motherboard' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'mb-05');
  store.getState().selectProduct('cpu-01');
  store.getState().setGoal({ budgetUsd: 1760 });
  await tools.recommend_products.execute({ category: 'motherboard' }, options);
  assert.equal(store.getState().recommendation!.candidates[0].productId, 'mb-01');
});

test('GPU trade-offs explain physical fit, VRAM, frame rate, power, and price differences', async () => {
  const { store, tools } = setup();
  store.getState().selectProduct('case-01');
  const result = await tools.recommend_products.execute({ category: 'gpu' }, options) as {
    products: Array<{ id: string; tradeoffs: string[] }>;
  };
  const byId = Object.fromEntries(result.products.map((product) => [product.id, product.tradeoffs.join(' ')]));
  assert.match(byId['gpu-05'], /black.*white case/i);
  assert.match(byId['gpu-05'], /16 mm longer/);
  assert.match(byId['gpu-02'], /4 GB less VRAM/);
  assert.match(byId['gpu-02'], /lower.*FPS/i);
  assert.match(byId['gpu-02'], /\$70.00 more/);
  assert.match(byId['gpu-06'], /850 W.*750 W/);
  assert.doesNotMatch(JSON.stringify(result.products), /Leaves \$.*rest of the build|your white color scheme/);
  assert.ok(productsById['gpu-05'].priceUsd < productsById['gpu-02'].priceUsd);
});

test('trade-offs are omitted when no concrete downside exists and recomputed from current state', () => {
  const { store } = setup();
  assert.deepEqual(describeCandidateTradeoffs(productsById['cpu-01'], {}, store.getState().goal, []), []);
  store.getState().selectProduct('case-01');
  const product = productsById['gpu-05'];
  const before = describeCandidateTradeoffs(product, store.getState().selected, store.getState().goal, []);
  assert.match(before.join(' '), /white case/);
  store.getState().selectProduct('case-02');
  const after = describeCandidateTradeoffs(product, store.getState().selected, store.getState().goal, []);
  assert.doesNotMatch(after.join(' '), /white case/);
});
