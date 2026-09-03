import { evaluateCompatibility } from './compatibility.ts';
import { products } from './data.ts';
import { evaluateBuildGoals } from './goals.ts';
import type { BuildGoal, Category, Product, Recommendation, SelectedBuild } from './types.ts';

const categoryLabels: Record<Category, string> = {
  case: 'Case', gpu: 'GPU', cpu: 'CPU', motherboard: 'Motherboard', psu: 'Power supply',
};

function performanceScore(product: Product) {
  if (product.category === 'cpu') return product.gamingScore;
  if (product.category === 'gpu') return product.score;
  return 0;
}

function productReason(product: Product, selected: SelectedBuild) {
  switch (product.category) {
    case 'cpu':
      return `${product.socket} socket, ${product.tdpW} W TDP. ${selected.motherboard ? 'Compare the socket with your selected motherboard.' : `Requires an ${product.socket} motherboard; none is selected yet.`} CPU changes do not affect this demo's GPU-based FPS estimates.`;
    case 'gpu':
      return `${product.vramGb} GB VRAM, ${product.lengthMm} mm long; recommends a ${product.recommendedPsuW} W PSU. Compare the app-calculated FPS and color trade-offs below.`;
    case 'case':
      return `${product.color} finish; fits ${product.motherboardForms.join('/')} boards, graphics cards up to ${product.maxGpuLengthMm} mm, and ${product.psuForm} power supplies.`;
    case 'motherboard':
      return `${product.socket} socket, ${product.form} form factor, ${product.color} finish. ${selected.cpu ? 'Check compatibility with your selected processor.' : `Requires an ${product.socket} processor; none is selected yet.`}`;
    case 'psu':
      return `${product.wattageW} W, ${product.form} form factor, ${product.efficiency} efficiency, ${product.color} finish. Check the selected GPU's power recommendation.`;
  }
}

/** Pure catalog ranking; recommendation generation never modifies the selected build. */
export function recommendProducts(
  selected: SelectedBuild,
  goal: BuildGoal,
  category: Category,
  basedOnBuildVersion: number,
  count = 3,
): Recommendation {
  const ranked = products.filter((product) => product.category === category).map((product) => {
    const projected = { ...selected, [category]: product };
    const compatibility = evaluateCompatibility(projected);
    const goals = evaluateBuildGoals(projected, goal);
    // Prefer safe, affordable options. FPS goals only distinguish GPUs in this demo.
    const rank = [
      compatibility.issues.filter((issue) => issue.severity === 'error').length,
      compatibility.issues.filter((issue) => issue.severity === 'warning').length,
      Math.max(0, -goals.remainingUsd),
      goal.priority === 'budget' ? 0 : Number(goals.theme.status === 'misses_goal'),
      goal.priority === 'budget' ? 0 : goals.games.filter((game) => game.status !== 'meets_goal').length,
      goal.priority === 'performance' ? -performanceScore(product) : 0,
      product.priceUsd,
    ];
    return { product, rank, compatibility };
  }).sort((a, b) => {
    for (let index = 0; index < a.rank.length; index++) {
      const difference = a.rank[index] - b.rank[index];
      if (difference) return difference;
    }
    return a.product.id.localeCompare(b.product.id);
  }).slice(0, count);

  return {
    category,
    basedOnBuildVersion,
    title: `${categoryLabels[category]} options for your build`,
    candidates: ranked.map(({ product, compatibility }, index) => ({
      productId: product.id,
      angle: index === 0 && compatibility.status === 'compatible' ? 'BEST BALANCE' :
        goal.priority === 'performance' && performanceScore(product) > 0 ? 'PERFORMANCE' : 'ALTERNATIVE',
      reason: productReason(product, selected),
    })),
  };
}
