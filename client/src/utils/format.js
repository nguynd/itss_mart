export const formatQuantity = (quantity, unit) => {
  if (quantity === undefined || quantity === null) return '';
  const isGram = unit === 'gram' || unit === 'g';
  if (isGram && quantity >= 1000) {
    const kilo = quantity / 1000;
    return `${Number(kilo.toFixed(2))} kilo`;
  }
  return `${quantity} ${unit}`;
};

export const formatQuantityValue = (quantity, unit) => {
  if (quantity === undefined || quantity === null) return '';
  const isGram = unit === 'gram' || unit === 'g';
  if (isGram && quantity >= 1000) {
    const kilo = quantity / 1000;
    return Number(kilo.toFixed(2));
  }
  return quantity;
};

export const formatUnit = (quantity, unit) => {
  if (quantity === undefined || quantity === null) return unit;
  const isGram = unit === 'gram' || unit === 'g';
  if (isGram && quantity >= 1000) {
    return 'kilo';
  }
  return unit === 'g' ? 'gram' : unit;
};
