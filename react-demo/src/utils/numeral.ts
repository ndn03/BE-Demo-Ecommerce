import numeral from 'numeral';

// This function formats a number to a specified number of decimal places.
export function formatNumber(
  number: number,
  decimals = 2,
  roundingMethod?: 'up' | 'down',
): string {
  const value = number || 0;
  const factor = 10 ** decimals;
  let roundedValue = Math.round(value * factor) / factor;

  if (roundingMethod === 'up') {
    roundedValue = Math.ceil(value * factor) / factor;
  } else if (roundingMethod === 'down') {
    roundedValue = Math.floor(value * factor) / factor;
  }

  const pattern =
    decimals > 0 ? `0,0[.]${Array(decimals).fill('0').join('')}` : '0,0';

  return numeral(roundedValue).format(pattern);
}
