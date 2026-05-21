export function normalizeShippingRate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateProductShippingAmount(quantity: number, shippingCharge: unknown, shippingLotSize?: unknown) {
  const itemCount = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 0;
  const rate = normalizeShippingRate(shippingCharge);
  const lotSize = Number.isFinite(Number(shippingLotSize)) && Number(shippingLotSize) > 0 ? Number(shippingLotSize) : 1;

  const lots = Math.ceil(itemCount / lotSize);
  return lots * rate;
}

export function getShippingModeLabel(shippingType: unknown) {
  return shippingType === 'weight' ? 'by weight' : 'per piece';
}