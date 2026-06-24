// Currency utility functions
export const formatZAR = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatZARSimple = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return `R ${amount.toLocaleString('en-ZA')}`;
};