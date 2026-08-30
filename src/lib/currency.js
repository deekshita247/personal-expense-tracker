export const CURRENCIES = ['AED', 'USD', 'EUR', 'GBP', 'INR'];

export function formatMoney(amount, currency) {
  return `${currency} ${Number(amount || 0).toLocaleString()}`;
}
