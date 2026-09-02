import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateCompatibility } from '../lib/domain/compatibility.ts';
import { productsById } from '../lib/domain/data.ts';

test('accepts the representative white build', () => {
  const result = evaluateCompatibility({
    case: productsById['case-01'],
    gpu: productsById['gpu-02'],
    cpu: productsById['cpu-01'],
    motherboard: productsById['mb-02'],
    psu: productsById['psu-04'],
  });

  assert.equal(result.status, 'compatible');
  assert.deepEqual(result.issues, []);
});

test('reports CPU socket mismatch as an error', () => {
  const result = evaluateCompatibility({
    cpu: productsById['cpu-01'],
    motherboard: productsById['mb-05'],
  });

  assert.equal(result.status, 'error');
  assert.equal(result.issues[0]?.code, 'CPU_SOCKET_MISMATCH');
  assert.equal(result.issues[0]?.severity, 'error');
});

test('reports GPU clearance as an error and undersized PSU as a warning', () => {
  const result = evaluateCompatibility({
    case: productsById['case-05'],
    gpu: productsById['gpu-06'],
    psu: productsById['psu-03'],
  });

  assert.deepEqual(
    result.issues.map((issue) => issue.code),
    ['GPU_TOO_LONG', 'PSU_WATTAGE_LOW', 'PSU_FORM_FACTOR_MISMATCH'],
  );
  assert.equal(result.status, 'error');
});
