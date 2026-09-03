import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';

import { formatUsd } from '../lib/domain/currency.ts';
import { products, productsById } from '../lib/domain/data.ts';
import { createBuildStore } from '../lib/store/build-store.ts';
import { createWebMcpTools } from '../lib/webmcp/tools.ts';

const options = { signal: new AbortController().signal };

test('formats US dollars with US separators and standard cents', () => {
  assert.equal(formatUsd(1970), '$1,970.00');
  assert.equal(formatUsd(188.5), '$188.50');
});

test('prices, budget, search, preview, and agent state all use USD', async () => {
  const store = createBuildStore();
  const tools = Object.fromEntries(createWebMcpTools(store).map((tool) => [tool.name, tool]));
  assert.equal(store.getState().goal.budgetUsd, 2000);
  assert.equal(productsById['case-01'].priceUsd, 188);

  const goal = await tools.set_build_goal.execute({ budgetUsd: 2100 }, options);
  assert.equal(goal.currency, 'USD');
  assert.equal(goal.goal.budgetUsd, 2100);
  const search = await tools.find_products.execute({ category: 'gpu', maxPriceUsd: 650 }, options);
  assert.equal(search.currency, 'USD');
  assert.deepEqual(search.products.map((product) => product.id), ['gpu-01', 'gpu-04']);
  const preview = await tools.preview_build_changes.execute({
    basedOnBuildVersion: 1,
    changes: { case: 'case-01', gpu: 'gpu-02', cpu: 'cpu-01', motherboard: 'mb-02', psu: 'psu-04' },
  }, options);
  assert.equal(preview.currency, 'USD');
  assert.equal(preview.totalUsd, 1970);
  assert.equal(preview.remainingBudgetUsd, 130);
  assert.doesNotMatch(JSON.stringify({ goal, search, preview }), /Yen|JPY|¥|￥/);
});

test('all 30 products have unique local product imagery and descriptive alt text', () => {
  assert.equal(products.length, 30);
  assert.equal(new Set(products.map((product) => product.image.src)).size, 30);
  for (const product of products) {
    assert.match(product.image.src, /^\/products\/[a-z]+-\d{2}\.webp$/);
    assert.ok(product.image.alt.includes(product.name));
    assert.ok(existsSync(new URL(`../public${product.image.src}`, import.meta.url)), product.id);
  }
});
