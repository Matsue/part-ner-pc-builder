import { evaluateCompatibility } from './compatibility.ts';
import { formatUsd } from './currency.ts';
import { games } from './data.ts';
import { evaluateBuildGoals } from './goals.ts';
import type { BuildGoal, Product, SelectedBuild } from './types.ts';

/** Live, catalog-grounded comparisons shared by the page and agent tools. */
export function describeCandidateTradeoffs(
  product: Product,
  selected: SelectedBuild,
  goal: BuildGoal,
  alternatives: Product[],
): string[] {
  const projected = { ...selected, [product.category]: product };
  const impact = evaluateBuildGoals(projected, goal);
  const tradeoffs = evaluateCompatibility(projected).issues.map((issue) => issue.detail);
  if (impact.remainingUsd < 0) tradeoffs.push(`${formatUsd(-impact.remainingUsd)} over your budget before any remaining parts.`);
  if (product.category === 'gpu') {
    for (const game of impact.games.filter((game) => game.status !== 'meets_goal')) {
      tradeoffs.push(`${games[game.gameId].name}: ${game.range.min}–${game.range.max} FPS vs your ${game.targetFps} FPS target.`);
    }
  }

  const peers = alternatives.filter((other) => other.category === product.category && other.id !== product.id)
    .sort((a, b) => a.priceUsd - b.priceUsd);
  const reference = peers[0] && product.priceUsd <= peers[0].priceUsd
    ? peers.find((other) => other.color && other.color !== product.color) ?? peers[0]
    : peers[0];

  if (product.category === 'gpu' && reference?.category === 'gpu') {
    if (product.vramGb < reference.vramGb) tradeoffs.push(`${reference.vramGb - product.vramGb} GB less VRAM than ${reference.name}.`);
    const referenceGames = evaluateBuildGoals({ ...selected, gpu: reference }, goal).games;
    const slowerGames = impact.games.filter((game, index) => game.range.min < referenceGames[index].range.min);
    if (slowerGames.length) tradeoffs.push(`Lower estimated FPS than ${reference.name} in ${slowerGames.map((game) => games[game.gameId].name).join(' and ')}.`);
    if (product.recommendedPsuW > reference.recommendedPsuW) tradeoffs.push(`Recommends an ${product.recommendedPsuW} W PSU vs ${reference.recommendedPsuW} W for ${reference.name}.`);
    if (product.lengthMm > reference.lengthMm) tradeoffs.push(`${product.lengthMm - reference.lengthMm} mm longer than ${reference.name} (${product.lengthMm} vs ${reference.lengthMm} mm).`);
  }
  if (product.category === 'cpu' && reference?.category === 'cpu') {
    if (product.tdpW > reference.tdpW) tradeoffs.push(`${product.tdpW} W TDP vs ${reference.tdpW} W for ${reference.name}; plan cooling accordingly.`);
    if (product.priceUsd > reference.priceUsd) tradeoffs.push('A higher CPU tier does not increase this demo’s GPU-based FPS estimates.');
  }
  if (product.category === 'case' && reference?.category === 'case') {
    if (product.maxGpuLengthMm < reference.maxGpuLengthMm) tradeoffs.push(`GPU clearance is ${product.maxGpuLengthMm} mm vs ${reference.maxGpuLengthMm} mm for ${reference.name}.`);
    if (!product.motherboardForms.includes('ATX') && reference.motherboardForms.includes('ATX')) tradeoffs.push('Does not support full-size ATX motherboards.');
  }
  if (product.category === 'motherboard' && selected.cpu && product.socket !== selected.cpu.socket) {
    tradeoffs.push(`Requires a ${product.socket} CPU; your selected CPU uses ${selected.cpu.socket}.`);
  }
  if (product.category === 'psu' && reference?.category === 'psu') {
    if (product.efficiency === 'Bronze' && reference.efficiency === 'Gold') tradeoffs.push(`Bronze rather than Gold efficiency, compared with ${reference.name}.`);
    if (product.wattageW < reference.wattageW) tradeoffs.push(`${reference.wattageW - product.wattageW} W less rated capacity than ${reference.name}; less room for a future GPU upgrade.`);
  }
  if (product.color && goal.theme !== 'any' && product.color !== goal.theme) {
    tradeoffs.push(`${product.color === 'black' ? 'Black' : 'White'} finish differs from your explicitly requested ${goal.theme} theme.`);
  } else if (product.category !== 'case' && product.color && selected.case && product.color !== selected.case.color) {
    tradeoffs.push(`${product.color === 'black' ? 'Black' : 'White'} finish contrasts with your selected ${selected.case.color} case.`);
  }
  if (reference && product.priceUsd > reference.priceUsd) tradeoffs.push(`${formatUsd(product.priceUsd - reference.priceUsd)} more than ${reference.name}.`);
  return [...new Set(tradeoffs)].slice(0, 3);
}
