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

export function getRegionFromState(stateName: string): 'North' | 'South' {
  if (!stateName) return 'North';
  const name = stateName.toLowerCase().trim();
  const southStates = [
    'tamil nadu', 'tamilnadu', 'tn',
    'kerala', 'kl',
    'karnataka', 'ka',
    'andhra pradesh', 'andhra', 'ap',
    'telangana', 'ts',
    'puducherry', 'pondicherry', 'py',
    'lakshadweep', 'ld',
    'andaman', 'an'
  ];
  const isSouth = southStates.some(s => name === s || name.includes(s));
  return isSouth ? 'South' : 'North';
}

export function getTierFromQuantity(quantity: number): '1' | '2' | '3' | '4' {
  if (quantity <= 2) return '1';
  if (quantity <= 5) return '2';
  if (quantity <= 10) return '3';
  return '4';
}

export function calculateRegionalShipping(
  product: any,
  stateName: string,
  quantity: number,
  selectedOptionId?: string
): number {
  if (!product) return 0;

  const region = getRegionFromState(stateName);
  const tier = getTierFromQuantity(quantity);
  const fieldName = `shipping${region}${tier}Ranges`;

  const ranges = product[fieldName];
  if (Array.isArray(ranges) && ranges.length > 0) {
    if (selectedOptionId) {
      const match = ranges.find(
        (r: any) => r.id === selectedOptionId || r._id?.toString() === selectedOptionId
      );
      if (match && match.charge !== '' && match.charge != null) {
        return Number(match.charge);
      }
    }
    const withCharge = ranges.filter((r: any) => r.charge !== '' && r.charge != null);
    if (withCharge.length > 0) {
      return Number(withCharge[0].charge);
    }
  }

  // Fallback to legacy calculation
  return calculateProductShippingAmount(quantity, product.shippingCharge, product.shippingLotSize);
}