export function normalizeShippingRate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateProductShippingAmount(quantity: number, shippingCharge: unknown) {
  const itemCount = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 0;
  const rate = normalizeShippingRate(shippingCharge);

  return itemCount * rate;
}

export function getShippingModeLabel(shippingType: unknown) {
  return shippingType === 'weight' ? 'by weight' : 'per piece';
}