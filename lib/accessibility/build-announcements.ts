import { evaluateCompatibility } from '../domain/compatibility.ts';
import { formatUsd } from '../domain/currency.ts';
import { evaluateBuildGoals } from '../domain/goals.ts';
import { resolveColorPreference } from '../domain/preferences.ts';
import { categories, type Category } from '../domain/types.ts';
import type { BuildStore } from '../store/build-store.ts';

const spokenCategory: Record<Category, string> = {
  case: 'case', gpu: 'GPU', cpu: 'CPU', motherboard: 'motherboard', psu: 'power supply',
};

function buildSummary(state: BuildStore): string {
  const goals = evaluateBuildGoals(state.selected, state.goal);
  const compatibility = evaluateCompatibility(state.selected);
  const budget = goals.remainingUsd < 0
    ? `${formatUsd(Math.abs(goals.remainingUsd))} over budget`
    : `${formatUsd(goals.remainingUsd)} remaining`;
  const status = compatibility.status === 'compatible'
    ? 'No compatibility conflicts.'
    : `Compatibility ${compatibility.status === 'error' ? 'issue' : 'warning'}: ${compatibility.issues[0]?.title}.`;
  return `Build total: ${formatUsd(goals.totalUsd)}. ${budget}. ${status}`;
}

/** Derives concise feedback without storing accessibility state in the build domain. */
export function describeBuildUpdate(previous: BuildStore, current: BuildStore): string {
  if (current.version !== previous.version) {
    const changed = categories.filter((category) => previous.selected[category]?.id !== current.selected[category]?.id);
    let action: string;
    if (current.goal !== previous.goal) {
      action = `Goals updated. Budget: ${formatUsd(current.goal.budgetUsd)}.`;
    } else if (Object.keys(current.selected).length === 0) {
      action = 'Build reset.';
    } else if (previous.preview && !current.preview) {
      action = 'Preview applied.';
    } else {
      action = changed.map((category) => current.selected[category]
        ? `${current.selected[category]!.name} selected.`
        : `${spokenCategory[category]} removed.`).join(' ') || 'Build updated.';
    }
    const expired = current.preview && current.preview.basedOnBuildVersion !== current.version
      && previous.preview?.basedOnBuildVersion === previous.version;
    const beforePreference = resolveColorPreference(previous.goal, previous.selected, previous.selectionSources, previous.themeExplicitlySet);
    const preference = resolveColorPreference(current.goal, current.selected, current.selectionSources, current.themeExplicitlySet);
    const inferred = preference.source === 'inferred'
      && (beforePreference.source !== 'inferred' || beforePreference.theme !== preference.theme)
      ? ` Your case and GPU choices suggest a ${preference.theme} style preference. This is inferred, not a stated goal.` : '';
    return `${action} ${buildSummary(current)}${inferred}${expired ? ' Your preview is out of date. Request a new preview.' : ''}`;
  }
  if (current.preview !== previous.preview) {
    return current.preview
      ? 'Preview ready. Changes are not applied. Review them in Your build.'
      : 'Preview dismissed. Your build has not changed.';
  }
  if (current.recommendation && current.recommendation !== previous.recommendation) {
    const { candidates, category } = current.recommendation;
    return `${candidates.length} ${spokenCategory[category]} ${candidates.length === 1 ? 'option' : 'options'} displayed. Your build has not changed.`;
  }
  return '';
}
