export const formatCurrency = (val: number, country: string = 'India'): string => {
  if (country === 'US' || country === 'USA') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  }
  // Primary default: Indian Rupees (INR)
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export const formatNumber = (val: number): string => {
  return new Intl.NumberFormat('en-IN').format(val);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};
