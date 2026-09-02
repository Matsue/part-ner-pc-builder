import type { CompatibilityIssue, CompatibilityResult, SelectedBuild } from './types.ts';

export function evaluateCompatibility(build: SelectedBuild): CompatibilityResult {
  const issues: CompatibilityIssue[] = [];

  if (build.cpu && build.motherboard && build.cpu.socket !== build.motherboard.socket) {
    issues.push({
      code: 'CPU_SOCKET_MISMATCH',
      severity: 'error',
      title: 'CPU and motherboard sockets do not match',
      detail: `${build.cpu.name} uses ${build.cpu.socket}, while ${build.motherboard.name} uses ${build.motherboard.socket}.`,
      affectedCategories: ['cpu', 'motherboard'],
    });
  }

  if (
    build.case &&
    build.motherboard &&
    !build.case.motherboardForms.includes(build.motherboard.form)
  ) {
    issues.push({
      code: 'MOTHERBOARD_FORM_FACTOR_MISMATCH',
      severity: 'error',
      title: 'Motherboard does not fit this case',
      detail: `${build.case.name} supports ${build.case.motherboardForms.join('/')}, not ${build.motherboard.form}.`,
      affectedCategories: ['case', 'motherboard'],
    });
  }

  if (build.case && build.gpu && build.gpu.lengthMm > build.case.maxGpuLengthMm) {
    issues.push({
      code: 'GPU_TOO_LONG',
      severity: 'error',
      title: 'Graphics card is too long for this case',
      detail: `${build.gpu.name} is ${build.gpu.lengthMm} mm; the case allows ${build.case.maxGpuLengthMm} mm.`,
      affectedCategories: ['case', 'gpu'],
    });
  }

  if (build.gpu && build.psu && build.psu.wattageW < build.gpu.recommendedPsuW) {
    issues.push({
      code: 'PSU_WATTAGE_LOW',
      severity: 'warning',
      title: 'Power supply is below the GPU recommendation',
      detail: `${build.gpu.name} recommends ${build.gpu.recommendedPsuW} W; the selected PSU provides ${build.psu.wattageW} W.`,
      affectedCategories: ['gpu', 'psu'],
    });
  }

  if (build.case && build.psu && build.case.psuForm !== build.psu.form) {
    issues.push({
      code: 'PSU_FORM_FACTOR_MISMATCH',
      severity: 'error',
      title: 'Power supply form factor does not fit',
      detail: `${build.case.name} requires ${build.case.psuForm}; the selected PSU is ${build.psu.form}.`,
      affectedCategories: ['case', 'psu'],
    });
  }

  return {
    issues,
    status: issues.some((issue) => issue.severity === 'error')
      ? 'error'
      : issues.length
        ? 'warning'
        : 'compatible',
  };
}

export function isProductCompatible(build: SelectedBuild, productId: string) {
  const product = Object.values(build).find((item) => item?.id === productId);
  if (!product) return true;
  return !evaluateCompatibility(build).issues.some((issue) =>
    issue.affectedCategories.includes(product.category),
  );
}
