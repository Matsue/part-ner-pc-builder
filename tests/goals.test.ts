import assert from 'node:assert/strict';
import test from 'node:test';

import { productsById } from '../lib/domain/data.ts';
import { evaluateBuildGoals, fpsRange } from '../lib/domain/goals.ts';
import type { BuildGoal } from '../lib/domain/types.ts';

const goal: BuildGoal = {
  budgetYen: 200_000,
  theme: 'white',
  priority: 'balanced',
  games: [
    {
      gameId: 'astral-frontier',
      resolution: '1440p',
      preset: 'high',
      targetFps: 60,
    },
    {
      gameId: 'neon-arena',
      resolution: '1440p',
      preset: 'competitive',
      targetFps: 144,
    },
  ],
};

test('uses a ±5% integer FPS range', () => {
  assert.deepEqual(fpsRange(74), { min: 70, max: 78 });
});

test('representative white build meets budget, theme, and both games', () => {
  const result = evaluateBuildGoals(
    {
      case: productsById['case-01'],
      gpu: productsById['gpu-02'],
      cpu: productsById['cpu-01'],
      motherboard: productsById['mb-02'],
      psu: productsById['psu-04'],
    },
    goal,
  );

  assert.equal(result.totalYen, 197_000);
  assert.equal(result.budget.status, 'meets_goal');
  assert.equal(result.theme.status, 'meets_goal');
  assert.deepEqual(
    result.games.map((game) => [game.gameId, game.range, game.status]),
    [
      ['astral-frontier', { min: 70, max: 78 }, 'meets_goal'],
      ['neon-arena', { min: 186, max: 206 }, 'meets_goal'],
    ],
  );
});

test('low GPU misses Astral goal while putting Neon on the target boundary', () => {
  const result = evaluateBuildGoals({ gpu: productsById['gpu-04'] }, goal);

  assert.equal(result.games[0]?.status, 'misses_goal');
  assert.equal(result.games[1]?.status, 'conditional');
});
