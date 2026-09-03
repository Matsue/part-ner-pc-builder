import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebMcpTools } from '../lib/webmcp/tools.ts';
import { createBuildStore } from '../lib/store/build-store.ts';

const options = { signal: new AbortController().signal };

test('declares the six required WebMCP tools with correct read hints', () => {
  const tools = createWebMcpTools(createBuildStore());
  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'get_current_build',
      'set_build_goal',
      'find_products',
      'show_product_candidates',
      'preview_build_changes',
      'apply_build_changes',
    ],
  );
  assert.equal(tools[0]?.annotations?.readOnlyHint, true);
  assert.equal(tools[1]?.annotations?.readOnlyHint, false);
  assert.equal(tools[2]?.annotations?.readOnlyHint, true);
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

test('preview/apply tools preserve stale-preview protection', async () => {
  const store = createBuildStore();
  store.getState().selectProduct('case-01', 'human');
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));
  const preview = await tools.preview_build_changes.execute({
    basedOnBuildVersion: 1,
    changes: { motherboard: 'mb-02', psu: 'psu-04' },
  }, options) as { previewId: string };

  store.getState().selectProduct('gpu-02', 'human');
  assert.throws(
    () => tools.apply_build_changes.execute({ previewId: preview.previewId }, options),
    (error: unknown) => error instanceof Error && error.message === 'PREVIEW_EXPIRED',
  );
});
