import numeral from 'numeral'

export function toCurrency(price: number) {
  return numeral(price).format('0,0[.]000')
}

export function toCurrencyWithTwoDecimals(price: number) {
  return numeral(price).format('0,0')
}
