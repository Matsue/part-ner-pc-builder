import type { BuildGoal, ColorPreference, SelectedBuild, SelectionSources } from './types.ts';

/** A single case choice is not evidence of a build-wide color preference. */
export function resolveColorPreference(
  goal: BuildGoal,
  selected: SelectedBuild,
  sources: SelectionSources = {},
  themeExplicitlySet = false,
): ColorPreference {
  if (themeExplicitlySet || goal.theme !== 'any') {
    return { theme: goal.theme, source: 'explicit', evidenceProductIds: [] };
  }
  if (sources.case === 'human' && sources.gpu === 'human'
    && selected.case && selected.gpu && selected.case.color === selected.gpu.color) {
    return {
      theme: selected.case.color,
      source: 'inferred',
      evidenceProductIds: [selected.case.id, selected.gpu.id],
    };
  }
  return { theme: 'any', source: 'unspecified', evidenceProductIds: [] };
}
