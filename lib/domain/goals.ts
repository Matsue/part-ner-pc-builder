import { benchmarks1440p } from './data.ts';
import type { BuildGoal, GameGoal, GoalStatus, SelectedBuild } from './types.ts';

export function fpsRange(baseFps: number) {
  return {
    min: Math.round(baseFps * 0.95),
    max: Math.round(baseFps * 1.05),
  };
}

function resolutionMultiplier(resolution: GameGoal['resolution']) {
  if (resolution === '1080p') return 1.28;
  if (resolution === '4k') return 0.58;
  return 1;
}

function gameStatus(range: { min: number; max: number }, target: number): GoalStatus {
  if (range.min >= target) return 'meets_goal';
  if (range.max >= target) return 'conditional';
  return 'misses_goal';
}

export function totalBuildPrice(build: SelectedBuild) {
  return Object.values(build).reduce((sum, product) => sum + (product?.priceYen ?? 0), 0);
}

export function evaluateBuildGoals(build: SelectedBuild, goal: BuildGoal) {
  const totalYen = totalBuildPrice(build);
  const coloredParts = Object.values(build).filter(
    (product): product is NonNullable<typeof product> & { color: 'white' | 'black' } =>
      Boolean(product && 'color' in product && product.color),
  );
  const themeMatches =
    goal.theme === 'any' || coloredParts.every((product) => product.color === goal.theme);

  const gameResults = goal.games.map((game) => {
    const base = build.gpu ? benchmarks1440p[build.gpu.id]?.[game.gameId] ?? 0 : 0;
    const adjusted = Math.round(base * resolutionMultiplier(game.resolution));
    const range = fpsRange(adjusted);
    return {
      gameId: game.gameId,
      resolution: game.resolution,
      preset: game.preset,
      targetFps: game.targetFps,
      range,
      status: gameStatus(range, game.targetFps),
    };
  });

  return {
    totalYen,
    remainingYen: goal.budgetYen - totalYen,
    budget: {
      status: (totalYen <= goal.budgetYen ? 'meets_goal' : 'misses_goal') as GoalStatus,
      differenceYen: goal.budgetYen - totalYen,
    },
    theme: {
      status: (themeMatches ? 'meets_goal' : 'misses_goal') as GoalStatus,
      selectedColors: [...new Set(coloredParts.map((product) => product.color))],
    },
    games: gameResults,
  };
}
