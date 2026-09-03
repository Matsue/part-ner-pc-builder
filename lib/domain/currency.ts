export const currency = 'USD' as const;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
});

export function formatUsd(amount: number) {
  return usdFormatter.format(amount);
}
