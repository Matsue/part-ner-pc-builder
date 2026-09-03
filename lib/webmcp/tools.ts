/// <reference types="webmcp-types" />

import type { StoreApi } from 'zustand/vanilla';

import { evaluateCompatibility } from '../domain/compatibility.ts';
import { currency } from '../domain/currency.ts';
import { products } from '../domain/data.ts';
import { evaluateBuildGoals, totalBuildPrice } from '../domain/goals.ts';
import type {
  BuildChangeIds,
  BuildGoal,
  CandidateAngle,
  Category,
  GameGoal,
  Product,
  Recommendation,
  SelectedBuild,
} from '../domain/types.ts';
import type { BuildStore } from '../store/build-store.ts';

export const baseToolNames = [
  'get_current_build',
  'set_build_goal',
  'find_products',
  'show_product_candidates',
  'preview_build_changes',
  'apply_build_changes',
] as const;

type AnyInput = Record<string, unknown>;

function objectInput(input: unknown): AnyInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('INVALID_INPUT');
  }
  return input as AnyInput;
}

function requiredString(input: AnyInput, key: string) {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
}

function requiredNumber(input: AnyInput, key: string) {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`INVALID_${key.toUpperCase()}`);
  return value;
}

function selectedProducts(build: SelectedBuild) {
  return Object.fromEntries(
    Object.entries(build).map(([category, product]) => [category, product ? {
      id: product.id,
      name: product.name,
      category: product.category,
      priceUsd: product.priceUsd,
    } : null]),
  );
}

export function currentBuildSnapshot(store: StoreApi<BuildStore>) {
  const state = store.getState();
  const compatibility = evaluateCompatibility(state.selected);
  const goals = evaluateBuildGoals(state.selected, state.goal);
  return {
    currency,
    buildVersion: state.version,
    goal: state.goal,
    selectedProducts: selectedProducts(state.selected),
    totalUsd: goals.totalUsd,
    remainingBudgetUsd: goals.remainingUsd,
    compatibilityStatus: compatibility.status,
    compatibilityIssues: compatibility.issues,
    goalStatus: {
      budget: goals.budget,
      theme: goals.theme,
      games: goals.games,
    },
  };
}

function projectProduct(build: SelectedBuild, product: Product): SelectedBuild {
  return { ...build, [product.category]: product } as SelectedBuild;
}

function productSearchResult(product: Product, state: BuildStore) {
  const projected = projectProduct(state.selected, product);
  const compatibility = evaluateCompatibility(projected);
  const goals = evaluateBuildGoals(projected, state.goal);
  return {
    currency,
    id: product.id,
    name: product.name,
    category: product.category,
    priceUsd: product.priceUsd,
    facts: product,
    compatibility: {
      status: compatibility.status,
      issues: compatibility.issues,
    },
    goalImpact: {
      budget: goals.budget,
      theme: goals.theme,
      games: goals.games,
    },
    projectedTotalUsd: goals.totalUsd,
    remainingBudgetUsd: goals.remainingUsd,
  };
}

function normalizeGameGoal(input: unknown): GameGoal {
  const game = objectInput(input);
  return {
    gameId: requiredString(game, 'gameId') as GameGoal['gameId'],
    resolution: requiredString(game, 'resolution') as GameGoal['resolution'],
    preset: requiredString(game, 'preset') as GameGoal['preset'],
    targetFps: requiredNumber(game, 'targetFps'),
  };
}

function changedParts(before: SelectedBuild, after: SelectedBuild) {
  const categories: Category[] = ['case', 'gpu', 'cpu', 'motherboard', 'psu'];
  return categories
    .filter((category) => before[category]?.id !== after[category]?.id)
    .map((category) => ({
      category,
      before: before[category] ? { id: before[category]?.id, name: before[category]?.name } : null,
      after: after[category] ? { id: after[category]?.id, name: after[category]?.name } : null,
    }));
}

function previewResult(
  preview: { id: string; basedOnBuildVersion: number; before: SelectedBuild; after: SelectedBuild },
  goal: BuildGoal,
) {
  const compatibility = evaluateCompatibility(preview.after);
  const goals = evaluateBuildGoals(preview.after, goal);
  return {
    currency,
    previewId: preview.id,
    basedOnBuildVersion: preview.basedOnBuildVersion,
    before: selectedProducts(preview.before),
    after: selectedProducts(preview.after),
    changedParts: changedParts(preview.before, preview.after),
    totalUsd: goals.totalUsd,
    remainingBudgetUsd: goals.remainingUsd,
    compatibilityAfterChange: compatibility,
    gameGoalsAfterChange: goals.games,
  };
}

export function createWebMcpTools(store: StoreApi<BuildStore>): WebMCP.ModelContextTool[] {
  return [
    {
      name: 'get_current_build',
      title: 'Get current PC build',
      description: 'Read the latest live PC build, goal, budget, deterministic compatibility issues, and game-goal status. Call this again after the human changes a part.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => currentBuildSnapshot(store),
    },
    {
      name: 'set_build_goal',
      title: 'Set PC build goal',
      description: 'Update the shared visible build goal after the user states their budget in US dollars (USD), visual theme, priority, or game targets.',
      inputSchema: {
        type: 'object',
        properties: {
          budgetUsd: { type: 'number', minimum: 1, description: 'Total parts budget in US dollars (USD), not cents.' },
          theme: { type: 'string', enum: ['white', 'black', 'any'] },
          priority: { type: 'string', enum: ['balanced', 'performance', 'budget', 'aesthetics'] },
          games: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                gameId: { type: 'string', enum: ['astral-frontier', 'neon-arena', 'colony-architect'] },
                resolution: { type: 'string', enum: ['1080p', '1440p', '4k'] },
                preset: { type: 'string', enum: ['high', 'competitive', 'ultra'] },
                targetFps: { type: 'number', minimum: 30, maximum: 360 },
              },
              required: ['gameId', 'resolution', 'preset', 'targetFps'],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        const patch: Partial<BuildGoal> = {};
        const budget = input.budgetUsd;
        if (budget !== undefined) {
          if (typeof budget !== 'number' || !Number.isFinite(budget) || budget <= 0) throw new Error('INVALID_BUDGET');
          patch.budgetUsd = budget;
        }
        if (input.theme !== undefined) patch.theme = requiredString(input, 'theme') as BuildGoal['theme'];
        if (input.priority !== undefined) patch.priority = requiredString(input, 'priority') as BuildGoal['priority'];
        if (input.games !== undefined) {
          if (!Array.isArray(input.games) || input.games.length > 3) throw new Error('INVALID_GAMES');
          patch.games = input.games.map(normalizeGameGoal);
        }
        store.getState().setGoal(patch, 'agent');
        return currentBuildSnapshot(store);
      },
    },
    {
      name: 'find_products',
      title: 'Find compatible PC parts',
      description: 'Search static product facts against the latest shared build and goal. All prices and budgets are in US dollars (USD). Returns app-calculated compatibility, projected total, budget, and game performance; do not invent these facts.',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['case', 'gpu', 'cpu', 'motherboard', 'psu'] },
          compatibleOnly: { type: 'boolean', default: false },
          maxPriceUsd: { type: 'number', minimum: 0, description: 'Maximum individual product price in US dollars (USD), not cents.' },
          limit: { type: 'integer', minimum: 1, maximum: 6, default: 6 },
        },
        required: ['category'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        const category = requiredString(input, 'category') as Category;
        const maxPrice = typeof input.maxPriceUsd === 'number' ? input.maxPriceUsd : Number.POSITIVE_INFINITY;
        const limit = typeof input.limit === 'number' ? Math.max(1, Math.min(6, Math.floor(input.limit))) : 6;
        const compatibleOnly = input.compatibleOnly === true;
        const state = store.getState();
        const results = products
          .filter((product) => product.category === category && product.priceUsd <= maxPrice)
          .map((product) => productSearchResult(product, state))
          .filter((result) => !compatibleOnly || result.compatibility.status !== 'error')
          .slice(0, limit);
        return { currency, basedOnBuildVersion: state.version, category, count: results.length, products: results };
      },
    },
    {
      name: 'show_product_candidates',
      title: 'Show product candidates in the shop',
      description: 'Render up to three meaningfully different product candidates in the visible shop recommendation UI. Supply product IDs and reasons only; the app renders all prices, compatibility, and performance facts.',
      inputSchema: {
        type: 'object',
        properties: {
          basedOnBuildVersion: { type: 'integer', minimum: 0 },
          category: { type: 'string', enum: ['case', 'gpu', 'cpu', 'motherboard', 'psu'] },
          title: { type: 'string', minLength: 1, maxLength: 100 },
          candidates: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                angle: { type: 'string', enum: ['BEST MATCH', 'BEST BALANCE', 'PERFORMANCE', 'BUDGET', 'AESTHETICS', 'WHITE BUILD'] },
                reason: { type: 'string', minLength: 1, maxLength: 240 },
              },
              required: ['productId', 'angle', 'reason'],
              additionalProperties: false,
            },
          },
        },
        required: ['basedOnBuildVersion', 'category', 'title', 'candidates'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (!Array.isArray(input.candidates)) throw new Error('INVALID_CANDIDATES');
        const recommendation: Recommendation = {
          basedOnBuildVersion: requiredNumber(input, 'basedOnBuildVersion'),
          category: requiredString(input, 'category') as Category,
          title: requiredString(input, 'title'),
          candidates: input.candidates.map((candidateInput) => {
            const candidate = objectInput(candidateInput);
            return {
              productId: requiredString(candidate, 'productId'),
              angle: requiredString(candidate, 'angle') as CandidateAngle,
              reason: requiredString(candidate, 'reason'),
            };
          }),
        };
        store.getState().showCandidates(recommendation);
        return {
          displayed: true,
          buildVersion: store.getState().version,
          category: recommendation.category,
          productIds: recommendation.candidates.map((candidate) => candidate.productId),
        };
      },
    },
    {
      name: 'preview_build_changes',
      title: 'Preview PC build changes',
      description: 'Stage one or more part changes against a specific live build version and show before/after facts in the page. This does not apply the changes.',
      inputSchema: {
        type: 'object',
        properties: {
          basedOnBuildVersion: { type: 'integer', minimum: 0 },
          changes: {
            type: 'object',
            properties: {
              case: { type: ['string', 'null'] },
              gpu: { type: ['string', 'null'] },
              cpu: { type: ['string', 'null'] },
              motherboard: { type: ['string', 'null'] },
              psu: { type: ['string', 'null'] },
            },
            minProperties: 1,
            additionalProperties: false,
          },
        },
        required: ['basedOnBuildVersion', 'changes'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        const changes = objectInput(input.changes) as BuildChangeIds;
        const preview = store.getState().previewChanges({
          basedOnBuildVersion: requiredNumber(input, 'basedOnBuildVersion'),
          changes,
        });
        return previewResult(preview, store.getState().goal);
      },
    },
    {
      name: 'apply_build_changes',
      title: 'Apply approved PC build changes',
      description: 'Apply exactly one previously generated preview by ID after the user approves it. Rejects missing or expired previews and accepts no free-form part changes.',
      inputSchema: {
        type: 'object',
        properties: { previewId: { type: 'string', minLength: 1 } },
        required: ['previewId'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        const preview = store.getState().applyPreview(requiredString(input, 'previewId'), 'agent');
        return { applied: true, previewId: preview.id, ...currentBuildSnapshot(store) };
      },
    },
  ];
}

function cheapestMatchingProduct(
  category: Category,
  predicate: (product: Product) => boolean,
) {
  return products
    .filter((product) => product.category === category && predicate(product))
    .sort((a, b) => a.priceUsd - b.priceUsd)[0];
}

export function createResolveBuildIssuesTool(store: StoreApi<BuildStore>): WebMCP.ModelContextTool {
  return {
    name: 'resolve_build_issues',
    title: 'Plan compatibility fixes',
    description: 'When the current build has a deterministic compatibility error, return multiple explicit repair plans and trade-offs without changing the build.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => {
      const state = store.getState();
      const compatibility = evaluateCompatibility(state.selected);
      const issue = compatibility.issues.find((item) => item.severity === 'error');
      if (!issue) throw new Error('NO_COMPATIBILITY_ERRORS');
      const plans: Array<{ id: string; label: string; changes: BuildChangeIds; tradeoff: string; projectedDeltaUsd: number }> = [];

      if (issue.code === 'CPU_SOCKET_MISMATCH' && state.selected.cpu && state.selected.motherboard) {
        const board = cheapestMatchingProduct('motherboard', (product) =>
          product.category === 'motherboard' &&
          product.socket === state.selected.cpu?.socket &&
          (state.goal.theme === 'any' || product.color === state.goal.theme),
        );
        const cpu = cheapestMatchingProduct('cpu', (product) =>
          product.category === 'cpu' && product.socket === state.selected.motherboard?.socket,
        );
        if (board) plans.push({
          id: 'keep-cpu',
          label: 'Keep the CPU; change the motherboard',
          changes: { motherboard: board.id },
          tradeoff: state.goal.theme === 'white' && board.color === 'white' ? 'Preserves the white theme.' : 'May make the visual theme mixed.',
          projectedDeltaUsd: board.priceUsd - state.selected.motherboard.priceUsd,
        });
        if (cpu) plans.push({
          id: 'keep-motherboard',
          label: 'Keep the motherboard; change the CPU',
          changes: { cpu: cpu.id },
          tradeoff: 'Changes the processor platform and may alter high-refresh performance.',
          projectedDeltaUsd: cpu.priceUsd - state.selected.cpu.priceUsd,
        });
      } else {
        const affected = issue.affectedCategories[1];
        if (affected) {
          const replacement = products
            .filter((product) => product.category === affected)
            .map((product) => ({ product, build: projectProduct(state.selected, product) }))
            .filter(({ build }) => evaluateCompatibility(build).status !== 'error')
            .sort((a, b) => a.product.priceUsd - b.product.priceUsd)[0]?.product;
          if (replacement) plans.push({
            id: `replace-${affected}`,
            label: `Replace the ${affected}`,
            changes: { [affected]: replacement.id },
            tradeoff: 'Lowest-cost compatible replacement from the current catalog.',
            projectedDeltaUsd: totalBuildPrice(projectProduct(state.selected, replacement)) - totalBuildPrice(state.selected),
          });
        }
      }

      return {
        currency,
        basedOnBuildVersion: state.version,
        issue,
        plans,
        nextStep: 'Choose a plan, then pass its changes to preview_build_changes. Do not apply it directly.',
      };
    },
  };
}
