/// <reference types="webmcp-types" />

import type { StoreApi } from 'zustand/vanilla';

import { evaluateCompatibility } from '../domain/compatibility.ts';
import { currency } from '../domain/currency.ts';
import { products, productsById } from '../domain/data.ts';
import { evaluateBuildGoals, totalBuildPrice } from '../domain/goals.ts';
import { recommendProducts } from '../domain/recommendations.ts';
import { resolveColorPreference } from '../domain/preferences.ts';
import { describeCandidateTradeoffs } from '../domain/tradeoffs.ts';
import { categories } from '../domain/types.ts';
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
  'recommend_products',
  'find_products',
  'show_product_candidates',
  'preview_build_changes',
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
      color: product.color ?? null,
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
    activeCategory: state.activeCategory,
    visibleRecommendations: state.recommendation?.category === state.activeCategory ? state.recommendation : null,
    pendingPreview: state.preview ? {
      ...previewResult(state.preview, state.goal),
      status: state.preview.basedOnBuildVersion === state.version ? 'awaiting_human_approval' : 'expired',
    } : null,
    goal: state.goal,
    colorPreference: resolveColorPreference(state.goal, state.selected, state.selectionSources, state.themeExplicitlySet),
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

function productSearchResult(product: Product, state: BuildStore, alternatives: Product[] = []) {
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
    tradeoffs: describeCandidateTradeoffs(product, state.selected, state.goal, alternatives),
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
    applied: false,
    requiresHumanApproval: true,
    nextStep: 'Stop here and ask the user to review the changes in Your build and click "Approve & apply preview". No WebMCP tool can apply changes. If this preview is expired, create a fresh preview instead. A request to finish the build is not approval of the resulting proposal.',
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
      description: 'Read the latest live PC build, stated goals, colorPreference with its explicit/inferred/unspecified source, compatibility, and visible recommendations. A case alone does not imply a color preference. Matching manually selected case and GPU colors provide a tentative hint, not a stated requirement. This does not recommend or display parts. For a part-selection question, use recommend_products to present options in the page; it reads the latest build itself.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => currentBuildSnapshot(store),
    },
    {
      name: 'set_build_goal',
      title: 'Set PC build goal',
      description: 'Update the shared visible build goal after the user states their budget in US dollars (USD), visual theme, priority, or game targets. This does not display recommendations. If the user also asks for part options, then use recommend_products for that category.',
      inputSchema: {
        type: 'object',
        properties: {
          budgetUsd: { type: 'number', minimum: 1, description: 'Total parts budget in US dollars (USD), not cents.' },
          theme: { type: 'string', enum: ['white', 'black', 'any'], description: 'Set only when the user explicitly states a color preference (or explicitly says color does not matter: any). Omit for a budget/FPS-only request. Do not turn a selected case color or inferred preference into a stated goal.' },
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
      name: 'recommend_products',
      title: 'Recommend and display PC part options',
      description: 'Use when the user asks which PC part to choose, requests recommendations, alternatives, or a comparison, including follow-ups such as "Which CPU is best?", "CPUはどれがいい？", or "GPUを3つ選んで". Reads the latest shared build and goals, ranks catalog parts, switches to the requested category, and displays three candidate cards by default in one call. No separate search or show_product_candidates call is needed. Does not select, add, buy, or preview any parts, or change the budget. Returns displayed product IDs, factual trade-offs, and the unchanged build version. The user need not name a tool or explicitly ask to display cards. For an explicitly chat-only answer or raw facts without page changes, use find_products instead.',
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: [...categories], description: 'The part the user is asking about, not necessarily the category currently open in the page.' },
          count: { type: 'integer', minimum: 1, maximum: 3, default: 3, description: 'Number of visible options. Omit for three, even when the user only asks which part is best.' },
        },
        required: ['category'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (rawInput) => {
        const input = objectInput(rawInput);
        if (Object.keys(input).some((key) => key !== 'category' && key !== 'count')) throw new Error('INVALID_INPUT');
        const category = requiredString(input, 'category') as Category;
        if (!categories.includes(category)) throw new Error('INVALID_CATEGORY');
        const count = input.count === undefined ? 3 : requiredNumber(input, 'count');
        if (!Number.isInteger(count) || count < 1 || count > 3) throw new Error('INVALID_COUNT');
        const state = store.getState();
        const colorPreference = resolveColorPreference(state.goal, state.selected, state.selectionSources, state.themeExplicitlySet);
        const recommendation = recommendProducts(state.selected, state.goal, category, state.version, count, colorPreference);
        const alternatives = recommendation.candidates.map((candidate) => productsById[candidate.productId]);
        store.getState().showCandidates(recommendation);
        return {
          currency,
          displayed: true,
          buildChanged: false,
          basedOnBuildVersion: state.version,
          category,
          count: recommendation.candidates.length,
          productIds: recommendation.candidates.map((candidate) => candidate.productId),
          candidates: recommendation.candidates,
          colorPreference,
          products: alternatives.map((product) => productSearchResult(product, state, alternatives)),
          missingCategories: categories.filter((item) => !state.selected[item]),
          notes: [
            'Cards are displayed in the page. No parts have been added or changed.',
            'Projected totals include only selected parts plus each candidate, not a completed build. Unselected parts still need budget.',
            'FPS estimates in this demo are GPU-based; CPU gaming scores do not change the displayed FPS. All products and benchmarks are fictional.',
            'Compatibility, budget, and FPS targets take precedence. When color is unspecified, choose value; a single case does not establish a color preference. Matching manual case/GPU choices supply a tentative color hint for later suggestions, not a new goal. Explain inferred preferences as tentative and allow the user to correct them.',
          ],
        };
      },
    },
    {
      name: 'find_products',
      title: 'Read product facts without changing the page',
      description: 'Read-only catalog lookup for raw product facts, explicit chat-only requests, or custom research. Does not display candidates or change the page. For recommendations, comparisons, or "which part should I choose?", prefer recommend_products, which also displays options. All prices are USD. Returns app-calculated compatibility, projected total, budget, and game performance; do not invent facts. Custom curated options can be displayed afterward with show_product_candidates.',
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
      description: 'Display a custom shortlist of up to three products already researched with find_products, with agent-written reasons. For ordinary recommendations or follow-up part questions, prefer recommend_products to choose and display options in one call. This only updates the recommendation cards, not selected parts. Supply product IDs and reasons; the app renders factual prices, compatibility, and performance.',
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
                angle: { type: 'string', enum: ['BEST MATCH', 'BEST BALANCE', 'PERFORMANCE', 'BUDGET', 'ALTERNATIVE', 'AESTHETICS', 'WHITE BUILD'] },
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
      description: 'Use for any request to add, replace, remove, or finish parts, including "Finish the rest of the build. Keep the white theme and stay under $2000." or "残りの構成を完成させて". Read the latest build and catalog facts, preserve existing selections unless the user requests replacements, then stage the proposed changes together against that build version. Shows before/after parts, total, and compatibility in Your build without applying. Stop after staging and ask the user to click "Approve & apply preview" in the page. Only that in-page action applies changes; there is no apply tool. A general instruction to finish a build is not approval of an unseen proposal.',
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
