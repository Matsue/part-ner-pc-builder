import type { GameId, Product } from './types.ts';

export const products: Product[] = [
  { id: 'case-01', category: 'case', name: 'AeroFrame N1 White', priceUsd: 188, image: { src: '/products/case-01.webp', alt: 'AeroFrame N1 White — fictional product render' }, color: 'white', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 355, psuForm: 'ATX', blurb: 'Airy dual-chamber showcase with a clean white finish.' },
  { id: 'case-02', category: 'case', name: 'AeroFrame N1 Black', priceUsd: 178, image: { src: '/products/case-02.webp', alt: 'AeroFrame N1 Black — fictional product render' }, color: 'black', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 355, psuForm: 'ATX', blurb: 'The same generous airflow in a discreet black shell.' },
  { id: 'case-03', category: 'case', name: 'FlowBox M2', priceUsd: 108, image: { src: '/products/case-03.webp', alt: 'FlowBox M2 — fictional product render' }, color: 'black', motherboardForms: ['mATX'], maxGpuLengthMm: 320, psuForm: 'ATX', blurb: 'Compact value case with a mesh-first cooling layout.' },
  { id: 'case-04', category: 'case', name: 'VistaCube W4', priceUsd: 148, image: { src: '/products/case-04.webp', alt: 'VistaCube W4 — fictional product render' }, color: 'white', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 340, psuForm: 'ATX', blurb: 'Panoramic white glass and flexible full-size support.' },
  { id: 'case-05', category: 'case', name: 'CompactForge S1', priceUsd: 138, image: { src: '/products/case-05.webp', alt: 'CompactForge S1 — fictional product render' }, color: 'black', motherboardForms: ['mATX'], maxGpuLengthMm: 305, psuForm: 'SFX', blurb: 'Small-footprint chassis for carefully planned builds.' },
  { id: 'case-06', category: 'case', name: 'QuietTower Q6', priceUsd: 198, image: { src: '/products/case-06.webp', alt: 'QuietTower Q6 — fictional product render' }, color: 'black', motherboardForms: ['ATX', 'mATX'], maxGpuLengthMm: 380, psuForm: 'ATX', blurb: 'Acoustic panels and room for the largest graphics cards.' },

  { id: 'gpu-01', category: 'gpu', name: 'PixelForge V60 16GB', priceUsd: 648, image: { src: '/products/gpu-01.webp', alt: 'PixelForge V60 16GB — fictional product render' }, color: 'black', vramGb: 16, lengthMm: 242, recommendedPsuW: 650, score: 72, blurb: 'Budget-friendly 1440p graphics with generous memory.' },
  { id: 'gpu-02', category: 'gpu', name: 'PixelForge V70 White 12GB', priceUsd: 898, image: { src: '/products/gpu-02.webp', alt: 'PixelForge V70 White 12GB — fictional product render' }, color: 'white', vramGb: 12, lengthMm: 304, recommendedPsuW: 750, score: 86, blurb: 'Balanced 1440p performance in a coordinated all-white design.' },
  { id: 'gpu-03', category: 'gpu', name: 'PixelForge V70 Ti 16GB', priceUsd: 1098, image: { src: '/products/gpu-03.webp', alt: 'PixelForge V70 Ti 16GB — fictional product render' }, color: 'black', vramGb: 16, lengthMm: 330, recommendedPsuW: 750, score: 94, blurb: 'High-refresh performance with added visual headroom.' },
  { id: 'gpu-04', category: 'gpu', name: 'VectorArc G68 16GB', priceUsd: 598, image: { src: '/products/gpu-04.webp', alt: 'VectorArc G68 16GB — fictional product render' }, color: 'black', vramGb: 16, lengthMm: 290, recommendedPsuW: 650, score: 68, blurb: 'The lowest entry price for a capable modern build.' },
  { id: 'gpu-05', category: 'gpu', name: 'VectorArc G88 16GB', priceUsd: 828, image: { src: '/products/gpu-05.webp', alt: 'VectorArc G88 16GB — fictional product render' }, color: 'black', vramGb: 16, lengthMm: 320, recommendedPsuW: 750, score: 88, blurb: 'Best performance-per-dollar for demanding 1440p games.' },
  { id: 'gpu-06', category: 'gpu', name: 'VectorArc G96 16GB', priceUsd: 998, image: { src: '/products/gpu-06.webp', alt: 'VectorArc G96 16GB — fictional product render' }, color: 'black', vramGb: 16, lengthMm: 340, recommendedPsuW: 850, score: 96, blurb: 'Maximum frame rate, with extra space and power needs.' },

  { id: 'cpu-01', category: 'cpu', name: 'CorePeak A6-65', priceUsd: 448, image: { src: '/products/cpu-01.webp', alt: 'CorePeak A6-65 — fictional product render' }, socket: 'A5', tdpW: 65, gamingScore: 82, blurb: 'Cool, efficient gaming performance without overspending.' },
  { id: 'cpu-02', category: 'cpu', name: 'CorePeak A8-65', priceUsd: 588, image: { src: '/products/cpu-02.webp', alt: 'CorePeak A8-65 — fictional product render' }, socket: 'A5', tdpW: 65, gamingScore: 88, blurb: 'More multitasking headroom at the same low power draw.' },
  { id: 'cpu-03', category: 'cpu', name: 'CorePeak A8X-120', priceUsd: 798, image: { src: '/products/cpu-03.webp', alt: 'CorePeak A8X-120 — fictional product render' }, socket: 'A5', tdpW: 120, gamingScore: 100, blurb: 'Peak simulation and high-refresh gaming performance.' },
  { id: 'cpu-04', category: 'cpu', name: 'Orion C6-125', priceUsd: 488, image: { src: '/products/cpu-04.webp', alt: 'Orion C6-125 — fictional product render' }, socket: 'O1', tdpW: 125, gamingScore: 80, blurb: 'Strong general performance on the Orbit platform.' },
  { id: 'cpu-05', category: 'cpu', name: 'Orion C8-125', priceUsd: 688, image: { src: '/products/cpu-05.webp', alt: 'Orion C8-125 — fictional product render' }, socket: 'O1', tdpW: 125, gamingScore: 89, blurb: 'Eight-core headroom for games and creative workloads.' },
  { id: 'cpu-06', category: 'cpu', name: 'Orion C8F-125', priceUsd: 638, image: { src: '/products/cpu-06.webp', alt: 'Orion C8F-125 — fictional product render' }, socket: 'O1', tdpW: 125, gamingScore: 91, blurb: 'Gaming-focused tuning with excellent frame pacing.' },

  { id: 'mb-01', category: 'motherboard', name: 'FrostBoard A5M WiFi', priceUsd: 218, image: { src: '/products/mb-01.webp', alt: 'FrostBoard A5M WiFi — fictional product render' }, socket: 'A5', form: 'mATX', color: 'black', blurb: 'Compact A5 foundation with wireless connectivity.' },
  { id: 'mb-02', category: 'motherboard', name: 'FrostBoard A5M Ice', priceUsd: 278, image: { src: '/products/mb-02.webp', alt: 'FrostBoard A5M Ice — fictional product render' }, socket: 'A5', form: 'mATX', color: 'white', blurb: 'White A5 board that completes a coordinated build.' },
  { id: 'mb-03', category: 'motherboard', name: 'ForgeBoard A5 Pro', priceUsd: 318, image: { src: '/products/mb-03.webp', alt: 'ForgeBoard A5 Pro — fictional product render' }, socket: 'A5', form: 'ATX', color: 'black', blurb: 'Full-size expansion for a flexible A5 build.' },
  { id: 'mb-04', category: 'motherboard', name: 'ForgeBoard A5 Creator', priceUsd: 478, image: { src: '/products/mb-04.webp', alt: 'ForgeBoard A5 Creator — fictional product render' }, socket: 'A5', form: 'ATX', color: 'black', blurb: 'Extra connectivity for workstation-class peripherals.' },
  { id: 'mb-05', category: 'motherboard', name: 'OrbitBoard O1M', priceUsd: 248, image: { src: '/products/mb-05.webp', alt: 'OrbitBoard O1M — fictional product render' }, socket: 'O1', form: 'mATX', color: 'black', blurb: 'Affordable compact entry to the O1 platform.' },
  { id: 'mb-06', category: 'motherboard', name: 'OrbitBoard O1 Pro', priceUsd: 408, image: { src: '/products/mb-06.webp', alt: 'OrbitBoard O1 Pro — fictional product render' }, socket: 'O1', form: 'ATX', color: 'black', blurb: 'Premium O1 power delivery and full-size expansion.' },

  { id: 'psu-01', category: 'psu', name: 'VoltNest 650 Bronze', priceUsd: 88, image: { src: '/products/psu-01.webp', alt: 'VoltNest 650 Bronze — fictional product render' }, wattageW: 650, form: 'ATX', efficiency: 'Bronze', color: 'black', blurb: 'Essential power for efficient midrange systems.' },
  { id: 'psu-02', category: 'psu', name: 'VoltNest 650 Gold', priceUsd: 118, image: { src: '/products/psu-02.webp', alt: 'VoltNest 650 Gold — fictional product render' }, wattageW: 650, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Higher efficiency for modest graphics cards.' },
  { id: 'psu-03', category: 'psu', name: 'VoltNest 750 Gold', priceUsd: 138, image: { src: '/products/psu-03.webp', alt: 'VoltNest 750 Gold — fictional product render' }, wattageW: 750, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Balanced headroom for performance 1440p builds.' },
  { id: 'psu-04', category: 'psu', name: 'VoltNest 750 Snow', priceUsd: 158, image: { src: '/products/psu-04.webp', alt: 'VoltNest 750 Snow — fictional product render' }, wattageW: 750, form: 'ATX', efficiency: 'Gold', color: 'white', blurb: 'Clean white cabling with the right gaming headroom.' },
  { id: 'psu-05', category: 'psu', name: 'VoltNest 850 Gold', priceUsd: 178, image: { src: '/products/psu-05.webp', alt: 'VoltNest 850 Gold — fictional product render' }, wattageW: 850, form: 'ATX', efficiency: 'Gold', color: 'black', blurb: 'Extra power margin for top-end graphics.' },
  { id: 'psu-06', category: 'psu', name: 'VoltNest 850 SFX Gold', priceUsd: 218, image: { src: '/products/psu-06.webp', alt: 'VoltNest 850 SFX Gold — fictional product render' }, wattageW: 850, form: 'SFX', efficiency: 'Gold', color: 'black', blurb: 'High output engineered for compact SFX systems.' },
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
