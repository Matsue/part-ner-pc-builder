export const categories = ['case', 'gpu', 'cpu', 'motherboard', 'psu'] as const;

export type Category = (typeof categories)[number];
export type ProductColor = 'white' | 'black';
export type Theme = ProductColor | 'any';
export type Priority = 'balanced' | 'performance' | 'budget' | 'aesthetics';
export type GoalStatus = 'meets_goal' | 'conditional' | 'misses_goal';
export type FormFactor = 'ATX' | 'mATX' | 'SFX';

type ProductBase = {
  id: string;
  category: Category;
  name: string;
  priceUsd: number;
  image: { src: string; alt: string };
  color?: ProductColor;
  blurb: string;
};

export type CaseProduct = ProductBase & {
  category: 'case';
  color: ProductColor;
  motherboardForms: Array<'ATX' | 'mATX'>;
  maxGpuLengthMm: number;
  psuForm: 'ATX' | 'SFX';
};

export type GpuProduct = ProductBase & {
  category: 'gpu';
  color: ProductColor;
  vramGb: number;
  lengthMm: number;
  recommendedPsuW: number;
  score: number;
};

export type CpuProduct = ProductBase & {
  category: 'cpu';
  socket: 'A5' | 'O1';
  tdpW: number;
  gamingScore: number;
};

export type MotherboardProduct = ProductBase & {
  category: 'motherboard';
  socket: 'A5' | 'O1';
  form: 'ATX' | 'mATX';
  color: ProductColor;
};

export type PsuProduct = ProductBase & {
  category: 'psu';
  wattageW: number;
  form: 'ATX' | 'SFX';
  efficiency: 'Bronze' | 'Gold';
  color: ProductColor;
};

export type Product =
  | CaseProduct
  | GpuProduct
  | CpuProduct
  | MotherboardProduct
  | PsuProduct;

export type SelectedBuild = Partial<{
  case: CaseProduct;
  gpu: GpuProduct;
  cpu: CpuProduct;
  motherboard: MotherboardProduct;
  psu: PsuProduct;
}>;

export type GameId = 'astral-frontier' | 'neon-arena' | 'colony-architect';

export type GameGoal = {
  gameId: GameId;
  resolution: '1080p' | '1440p' | '4k';
  preset: 'high' | 'competitive' | 'ultra';
  targetFps: number;
};

export type BuildGoal = {
  budgetUsd: number;
  theme: Theme;
  priority: Priority;
  games: GameGoal[];
};

export type CompatibilityIssue = {
  code:
    | 'CPU_SOCKET_MISMATCH'
    | 'MOTHERBOARD_FORM_FACTOR_MISMATCH'
    | 'GPU_TOO_LONG'
    | 'PSU_FORM_FACTOR_MISMATCH'
    | 'PSU_WATTAGE_LOW';
  severity: 'warning' | 'error';
  title: string;
  detail: string;
  affectedCategories: Category[];
};

export type CompatibilityResult = {
  status: 'compatible' | 'warning' | 'error';
  issues: CompatibilityIssue[];
};

export type CandidateAngle =
  | 'BEST MATCH'
  | 'BEST BALANCE'
  | 'PERFORMANCE'
  | 'BUDGET'
  | 'AESTHETICS'
  | 'WHITE BUILD';

export type Recommendation = {
  basedOnBuildVersion: number;
  category: Category;
  title: string;
  candidates: Array<{
    productId: string;
    angle: CandidateAngle;
    reason: string;
  }>;
};

export type BuildChangeIds = Partial<Record<Category, string | null>>;

export type BuildPreview = {
  id: string;
  basedOnBuildVersion: number;
  before: SelectedBuild;
  after: SelectedBuild;
  changes: BuildChangeIds;
};
