import type { GameId, Product } from './types.ts';

export const products: Product[] = [
  { id: 'case-01', category: 'case', name: 'AeroFrame N1 White', priceYen: 18_800, color: 'white', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 355, psuForm: 'ATX', blurb: 'Airy dual-chamber showcase with a clean white finish.' },
  { id: 'case-02', category: 'case', name: 'AeroFrame N1 Black', priceYen: 17_800, color: 'black', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 355, psuForm: 'ATX', blurb: 'The same generous airflow in a discreet black shell.' },
  { id: 'case-03', category: 'case', name: 'FlowBox M2', priceYen: 10_800, color: 'black', motherboardForms: ['mATX'], maxGpuLengthMm: 320, psuForm: 'ATX', blurb: 'Compact value case with a mesh-first cooling layout.' },
  { id: 'case-04', category: 'case', name: 'VistaCube W4', priceYen: 14_800, color: 'white', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 340, psuForm: 'ATX', blurb: 'Panoramic white glass and flexible full-size support.' },
  { id: 'case-05', category: 'case', name: 'CompactForge S1', priceYen: 13_800, color: 'black', motherboardForms: ['mATX'], maxGpuLengthMm: 305, psuForm: 'SFX', blurb: 'Small-footprint chassis for carefully planned builds.' },
  { id: 'case-06', category: 'case', name: 'QuietTower Q6', priceYen: 19_800, color: 'black', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 380, psuForm: 'ATX', blurb: 'Acoustic panels and room for the largest graphics cards.' },

  { id: 'gpu-01', category: 'gpu', name: 'PixelForge V60 16GB', priceYen: 64_800, color: 'black', vramGb: 16, lengthMm: 242, recommendedPsuW: 650, score: 72, blurb: 'Budget-friendly 1440p graphics with generous memory.' },
  { id: 'gpu-02', category: 'gpu', name: 'PixelForge V70 White 12GB', priceYen: 89_800, color: 'white', vramGb: 12, lengthMm: 304, recommendedPsuW: 750, score: 86, blurb: 'Balanced 1440p performance in a rare all-white design.' },
  { id: 'gpu-03', category: 'gpu', name: 'PixelForge V70 Ti 16GB', priceYen: 109_800, color: 'black', vramGb: 16, lengthMm: 330, recommendedPsuW: 750, score: 94, blurb: 'High-refresh performance with added visual headroom.' },
  { id: 'gpu-04', category: 'gpu', name: 'VectorArc G68 16GB', priceYen: 59_800, color: 'black', vramGb: 16, lengthMm: 290, recommendedPsuW: 650, score: 68, blurb: 'The lowest entry price for a capable modern build.' },
  { id: 'gpu-05', category: 'gpu', name: 'VectorArc G88 16GB', priceYen: 82_800, color: 'black', vramGb: 16, lengthMm: 320, recommendedPsuW: 750, score: 88, blurb: 'Best performance-per-yen for demanding 1440p games.' },
  { id: 'gpu-06', category: 'gpu', name: 'VectorArc G96 16GB', priceYen: 99_800, color: 'black', vramGb: 16, lengthMm: 340, recommendedPsuW: 850, score: 96, blurb: 'Maximum frame rate, with extra space and power needs.' },

  { id: 'cpu-01', category: 'cpu', name: 'CorePeak A6-65', priceYen: 44_800, socket: 'A5', tdpW: 65, gamingScore: 82, blurb: 'Cool, efficient gaming performance without overspending.' },
  { id: 'cpu-02', category: 'cpu', name: 'CorePeak A8-65', priceYen: 58_800, socket: 'A5', tdpW: 65, gamingScore: 88, blurb: 'More multitasking headroom at the same low power draw.' },
  { id: 'cpu-03', category: 'cpu', name: 'CorePeak A8X-120', priceYen: 79_800, socket: 'A5', tdpW: 120, gamingScore: 100, blurb: 'Peak simulation and high-refresh gaming performance.' },
  { id: 'cpu-04', category: 'cpu', name: 'Orion C6-125', priceYen: 48_800, socket: 'O1', tdpW: 125, gamingScore: 80, blurb: 'Strong general performance on the Orbit platform.' },
  { id: 'cpu-05', category: 'cpu', name: 'Orion C8-125', priceYen: 68_800, socket: 'O1', tdpW: 125, gamingScore: 89, blurb: 'Eight-core headroom for games and creative workloads.' },
  { id: 'cpu-06', category: 'cpu', name: 'Orion C8F-125', priceYen: 63_800, socket: 'O1', tdpW: 125, gamingScore: 91, blurb: 'Gaming-focused tuning with excellent frame pacing.' },

  { id: 'mb-01', category: 'motherboard', name: 'FrostBoard A5M WiFi', priceYen: 21_800, socket: 'A5', form: 'mATX', color: 'black', blurb: 'Compact A5 foundation with wireless connectivity.' },
  { id: 'mb-02', category: 'motherboard', name: 'FrostBoard A5M Ice', priceYen: 27_800, socket: 'A5', form: 'mATX', color: 'white', blurb: 'White A5 board that completes a coordinated build.' },
  { id: 'mb-03', category: 'motherboard', name: 'ForgeBoard A5 Pro', priceYen: 31_800, socket: 'A5', form: 'ATX', color: 'black', blurb: 'Full-size expansion for a flexible A5 build.' },
  { id: 'mb-04', category: 'motherboard', name: 'ForgeBoard A5 Creator', priceYen: 47_800, socket: 'A5', form: 'ATX', color: 'black', blurb: 'Extra connectivity for workstation-class peripherals.' },
  { id: 'mb-05', category: 'motherboard', name: 'OrbitBoard O1M', priceYen: 24_800, socket: 'O1', form: 'mATX', color: 'black', blurb: 'Affordable compact entry to the O1 platform.' },
  { id: 'mb-06', category: 'motherboard', name: 'OrbitBoard O1 Pro', priceYen: 40_800, socket: 'O1', form: 'ATX', color: 'black', blurb: 'Premium O1 power delivery and full-size expansion.' },

  { id: 'psu-01', category: 'psu', name: 'VoltNest 650 Bronze', priceYen: 8_800, wattageW: 650, form: 'ATX', efficiency: 'Bronze', color: 'black', blurb: 'Essential power for efficient midrange systems.' },
  { id: 'psu-02', category: 'psu', name: 'VoltNest 650 Gold', priceYen: 11_800, wattageW: 650, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Higher efficiency for modest graphics cards.' },
  { id: 'psu-03', category: 'psu', name: 'VoltNest 750 Gold', priceYen: 13_800, wattageW: 750, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Balanced headroom for performance 1440p builds.' },
  { id: 'psu-04', category: 'psu', name: 'VoltNest 750 Snow', priceYen: 15_800, wattageW: 750, form: 'ATX', efficiency: 'Gold', color: 'white', blurb: 'Clean white cabling with the right gaming headroom.' },
  { id: 'psu-05', category: 'psu', name: 'VoltNest 850 Gold', priceYen: 17_800, wattageW: 850, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Extra power margin for top-end graphics.' },
  { id: 'psu-06', category: 'psu', name: 'VoltNest 850 SFX Gold', priceYen: 21_800, wattageW: 850, form: 'SFX', efficiency: 'Gold', color: 'black', blurb: 'High output engineered for compact SFX systems.' },
];

export const productsById: Record<string, Product> = Object.fromEntries(
  products.map((product) => [product.id, product]),
);

export const games: Record<GameId, { name: string; description: string }> = {
  'astral-frontier': { name: 'Astral Frontier', description: 'GPU-heavy action RPG' },
  'neon-arena': { name: 'Neon Arena', description: 'High-refresh competitive FPS' },
  'colony-architect': { name: 'Colony Architect', description: 'CPU-heavy city builder' },
};

export const benchmarks1440p: Record<string, Record<GameId, number>> = {
  'gpu-01': { 'astral-frontier': 52, 'neon-arena': 156, 'colony-architect': 92 },
  'gpu-02': { 'astral-frontier': 74, 'neon-arena': 196, 'colony-architect': 110 },
  'gpu-03': { 'astral-frontier': 88, 'neon-arena': 220, 'colony-architect': 124 },
  'gpu-04': { 'astral-frontier': 49, 'neon-arena': 150, 'colony-architect': 89 },
  'gpu-05': { 'astral-frontier': 82, 'neon-arena': 204, 'colony-architect': 114 },
  'gpu-06': { 'astral-frontier': 94, 'neon-arena': 230, 'colony-architect': 130 },
};
