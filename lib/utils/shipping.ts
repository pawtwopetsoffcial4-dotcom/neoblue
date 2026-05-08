export function normalizeShippingRate(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function calculateShippingAmount(quantity: number, shippingPerPiece: unknown, shippingPerWeight: unknown) {
  const itemCount = Number.isFinite(Number(quantity)) && Number(quantity) > 0 ? Number(quantity) : 0;
  const pieceRate = normalizeShippingRate(shippingPerPiece);
  const weightRate = normalizeShippingRate(shippingPerWeight);

  if (itemCount <= 1) {
    return pieceRate;
  }

  return weightRate * itemCount;
}