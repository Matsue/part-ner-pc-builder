import { createStore, type StoreApi } from 'zustand/vanilla';

import { productsById } from '../domain/data.ts';
import type {
  BuildChangeIds,
  BuildGoal,
  BuildPreview,
  Category,
  Product,
  Recommendation,
  SelectedBuild,
  SelectionSources,
} from '../domain/types.ts';

export const defaultGoal: BuildGoal = {
  budgetUsd: 2_000,
  theme: 'any',
  priority: 'balanced',
  games: [
    { gameId: 'astral-frontier', resolution: '1440p', preset: 'high', targetFps: 60 },
    { gameId: 'neon-arena', resolution: '1440p', preset: 'competitive', targetFps: 144 },
  ],
};

type MutationActor = 'human' | 'agent';

export type BuildStore = {
  version: number;
  goal: BuildGoal;
  themeExplicitlySet: boolean;
  selected: SelectedBuild;
  selectionSources: SelectionSources;
  activeCategory: Category;
  recommendation: Recommendation | null;
  preview: BuildPreview | null;
  lastMutation: MutationActor | null;
  setActiveCategory: (category: Category) => void;
  selectProduct: (productId: string, actor?: MutationActor) => void;
  setGoal: (goal: Partial<BuildGoal>, actor?: MutationActor) => void;
  showCandidates: (recommendation: Recommendation) => void;
  previewChanges: (input: {
    basedOnBuildVersion: number;
    changes: BuildChangeIds;
  }) => BuildPreview;
  applyPreview: (previewId: string, actor?: MutationActor) => BuildPreview;
  dismissPreview: () => void;
  clearBuild: () => void;
};

function withProduct(build: SelectedBuild, product: Product): SelectedBuild {
  return { ...build, [product.category]: product } as SelectedBuild;
}

function assertVersion(actual: number, expected: number, code = 'STALE_BUILD_STATE') {
  if (actual !== expected) throw new Error(code);
}

function createPreviewId() {
  return `preview-${crypto.randomUUID()}`;
}

export function createBuildStore(): StoreApi<BuildStore> {
  return createStore<BuildStore>((set, get) => ({
    version: 0,
    goal: defaultGoal,
    themeExplicitlySet: false,
    selected: {},
    selectionSources: {},
    activeCategory: 'case',
    recommendation: null,
    preview: null,
    lastMutation: null,
    setActiveCategory: (activeCategory) => set({ activeCategory }),
    selectProduct: (productId, actor = 'human') => {
      if (actor !== 'human') throw new Error('HUMAN_APPROVAL_REQUIRED');
      const product = productsById[productId];
      if (!product) throw new Error('PRODUCT_NOT_FOUND');
      set((state) => ({
        selected: withProduct(state.selected, product),
        selectionSources: { ...state.selectionSources, [product.category]: actor },
        version: state.version + 1,
        activeCategory: product.category,
        lastMutation: actor,
      }));
    },
    setGoal: (goal, actor = 'agent') => {
      set((state) => ({
        goal: { ...state.goal, ...goal },
        themeExplicitlySet: state.themeExplicitlySet || goal.theme !== undefined,
        version: state.version + 1,
        lastMutation: actor,
      }));
    },
    showCandidates: (recommendation) => {
      assertVersion(get().version, recommendation.basedOnBuildVersion);
      if (recommendation.candidates.length > 3) throw new Error('TOO_MANY_CANDIDATES');
      if (recommendation.candidates.some((item) => productsById[item.productId]?.category !== recommendation.category)) {
        throw new Error('INVALID_CANDIDATE_CATEGORY');
      }
      set({ recommendation, activeCategory: recommendation.category });
    },
    previewChanges: ({ basedOnBuildVersion, changes }) => {
      assertVersion(get().version, basedOnBuildVersion);
      let after = { ...get().selected };
      for (const [category, productId] of Object.entries(changes) as Array<[Category, string | null]>) {
        if (productId === null) {
          delete after[category];
          continue;
        }
        const product = productsById[productId];
        if (!product) throw new Error('PRODUCT_NOT_FOUND');
        if (product.category !== category) throw new Error('INVALID_PRODUCT_CATEGORY');
        after = withProduct(after, product);
      }
      const preview: BuildPreview = {
        id: createPreviewId(),
        basedOnBuildVersion,
        before: get().selected,
        after,
        changes,
      };
      set({ preview });
      return preview;
    },
    applyPreview: (previewId, actor = 'agent') => {
      const preview = get().preview;
      if (!preview || preview.id !== previewId) throw new Error('PREVIEW_NOT_FOUND');
      assertVersion(get().version, preview.basedOnBuildVersion, 'PREVIEW_EXPIRED');
      // A preview ID proves what was proposed, not that a person approved it.
      // Only the in-page approval handler may apply; WebMCP cannot self-approve.
      if (actor !== 'human') throw new Error('HUMAN_APPROVAL_REQUIRED');
      set((state) => {
        const selectionSources = { ...state.selectionSources };
        for (const category of Object.keys(preview.changes) as Category[]) {
          if (!preview.after[category]) delete selectionSources[category];
          else if (state.selected[category]?.id !== preview.after[category]?.id) {
            // Approving a batch is not an independent manual style choice.
            selectionSources[category] = 'preview';
          }
        }
        return {
          selected: preview.after,
          selectionSources,
          version: state.version + 1,
          preview: null,
          lastMutation: actor,
        };
      });
      return preview;
    },
    dismissPreview: () => set({ preview: null }),
    clearBuild: () =>
      set((state) => ({
        selected: {},
        selectionSources: {},
        recommendation: null,
        preview: null,
        version: state.version + 1,
        activeCategory: 'case',
        lastMutation: 'human',
      })),
  }));
}

export const buildStore = createBuildStore();
