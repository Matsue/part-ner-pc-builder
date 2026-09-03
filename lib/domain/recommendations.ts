import { evaluateCompatibility } from './compatibility.ts';
import { products } from './data.ts';
import { evaluateBuildGoals } from './goals.ts';
import { resolveColorPreference } from './preferences.ts';
import type { BuildGoal, Category, ColorPreference, Product, Recommendation, SelectedBuild } from './types.ts';

const categoryLabels: Record<Category, string> = {
  case: 'Case', gpu: 'GPU', cpu: 'CPU', motherboard: 'Motherboard', psu: 'Power supply',
};

function performanceScore(product: Product) {
  if (product.category === 'cpu') return product.gamingScore;
  if (product.category === 'gpu') return product.score;
  return 0;
}

function meetsGpuTargets(product: Product, selected: SelectedBuild, goal: BuildGoal) {
  if (product.category !== 'gpu' || goal.games.length === 0) return false;
  const build = { ...selected, gpu: product };
  const goals = evaluateBuildGoals(build, goal);
  return evaluateCompatibility(build).status === 'compatible' && goals.remainingUsd >= 0
    && goals.games.every((game) => game.status === 'meets_goal');
}

function productReason(product: Product, selected: SelectedBuild, goal: BuildGoal) {
  switch (product.category) {
    case 'cpu':
      return `${product.socket} socket, ${product.tdpW} W TDP. ${selected.motherboard ? 'Compare the socket with your selected motherboard.' : `Requires an ${product.socket} motherboard; none is selected yet.`} CPU changes do not affect this demo's GPU-based FPS estimates.`;
    case 'gpu': {
      const meetsTargets = meetsGpuTargets(product, selected, goal);
      const cheapest = meetsTargets && !products.some((other) => other.priceUsd < product.priceUsd && meetsGpuTargets(other, selected, goal));
      const benefit = cheapest ? 'Lowest-priced compatible GPU meeting every FPS target.'
        : meetsTargets ? 'Meets every FPS target.' : 'Compare the FPS estimates with your targets.';
      return `${benefit} ${product.color === 'white' ? 'White' : 'Black'} finish, ${product.vramGb} GB VRAM; ${product.lengthMm} mm long, ${product.recommendedPsuW} W PSU recommended.`;
    }
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
  preference: ColorPreference = resolveColorPreference(goal, selected),
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
      goals.games.filter((game) => game.status !== 'meets_goal').length,
      goal.priority === 'performance' ? -performanceScore(product) : 0,
      goal.priority === 'budget' || preference.theme === 'any' || !product.color ? 0 : Number(product.color !== preference.theme),
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
      angle: index === 0 && compatibility.status === 'compatible'
        && (category !== 'gpu' || meetsGpuTargets(product, selected, goal)) ? 'BEST BALANCE'
        : product.color && product.color !== ranked[0].product.color ? 'AESTHETICS'
        : performanceScore(product) > performanceScore(ranked[0].product) ? 'PERFORMANCE'
        : product.priceUsd < ranked[0].product.priceUsd ? 'BUDGET' : 'ALTERNATIVE',
      reason: productReason(product, selected, goal),
    })),
  };
}
