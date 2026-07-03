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
  
  // Check if state is non-serviceable for this vendor
  const vendor = product.vendorId;
  if (vendor && typeof vendor === 'object') {
    const nonServiceable = vendor.nonServiceableStates || [];
    if (stateName && nonServiceable.some((s: string) => s.toLowerCase().trim() === stateName.toLowerCase().trim())) {
      return 0; // Return 0 shipping or let checkout block it
    }
  }

  const weightPerPiece = product.weightPerPiece || 0;
  const totalWeight = weightPerPiece * quantity;

  return getShippingChargeForWeight(totalWeight, region, vendor, stateName);
}

export function getShippingChargeForWeight(
  weightGrams: number,
  region: 'North' | 'South',
  vendor: any,
  customerState?: string
): number {
  if (weightGrams <= 0) return 0;

  // Slabs: 500g, 1kg, 2kg, 3kg, 5kg, 10kg
  const slabLimits = [500, 1000, 2000, 3000, 5000, 10000];
  let selectedLimit = 10000;
  for (const limit of slabLimits) {
    if (weightGrams <= limit) {
      selectedLimit = limit;
      break;
    }
  }

  const key = `slab${selectedLimit >= 1000 ? (selectedLimit / 1000) + 'kg' : selectedLimit + 'g'}`;

  // If vendor is populated and has rates
  if (vendor && typeof vendor === 'object') {
    const rates = region === 'South' ? vendor.shippingRatesSouth : vendor.shippingRatesNorth;
    if (rates && rates[key] !== undefined && rates[key] !== null) {
      return Number(rates[key]) || 0;
    }
  }

  return 0;
}

export function calculateCartShipping(
  items: Array<{ productId: string; quantity: number }>,
  productDetails: Record<string, any>,
  stateName: string
): { 
  totalShipping: number; 
  vendorShipping: Record<string, number>; 
  isServiceable: boolean; 
  nonServiceableMessage: string | null; 
} {
  const vendorWeights: Record<string, { weight: number; vendor: any }> = {};
  let isServiceable = true;
  let nonServiceableMessage: string | null = null;
  const region = getRegionFromState(stateName);

  for (const item of items) {
    const product = productDetails[item.productId];
    if (!product) continue;

    const vendor = typeof product.vendorId === 'object' && product.vendorId !== null ? product.vendorId : null;
    const vendorId = vendor?._id || product.vendorId;
    if (!vendorId) continue;

    // Check if the state is non-serviceable for this vendor
    const nonServiceable = vendor?.nonServiceableStates || [];
    if (stateName && nonServiceable.some((s: string) => s.toLowerCase().trim() === stateName.toLowerCase().trim())) {
      isServiceable = false;
      nonServiceableMessage = `Sorry, this product (${product.title}) cannot be delivered to your location.`;
    }

    const weightPerPiece = product.weightPerPiece || 0;
    const totalWeight = weightPerPiece * item.quantity;

    if (!vendorWeights[vendorId]) {
      vendorWeights[vendorId] = { weight: 0, vendor };
    }
    vendorWeights[vendorId].weight += totalWeight;
  }

  let totalShipping = 0;
  const vendorShipping: Record<string, number> = {};

  for (const [vendorId, group] of Object.entries(vendorWeights)) {
    const charge = getShippingChargeForWeight(group.weight, region, group.vendor, stateName);
    vendorShipping[vendorId] = charge;
    totalShipping += charge;
  }

  return { totalShipping, vendorShipping, isServiceable, nonServiceableMessage };
}