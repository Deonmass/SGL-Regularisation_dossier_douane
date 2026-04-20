// Format numbers with thousand separators
export const formatCurrency = (value: number, locale: string = 'fr-FR'): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, locale: string = 'fr-FR'): string => {
  return new Intl.NumberFormat(locale).format(Math.round(value));
};
