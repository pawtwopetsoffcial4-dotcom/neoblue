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

export function getDistanceZoneMultiplier(vendorState: string, customerState: string): number {
  if (!vendorState || !customerState) return 1.0;
  
  const vState = vendorState.toLowerCase().trim();
  const cState = customerState.toLowerCase().trim();
  
  if (vState === cState) {
    return 0.6; // Local state delivery: 40% discount
  }

  const zones: Record<string, string> = {
    // South
    'karnataka': 'south', 'ka': 'south',
    'tamil nadu': 'south', 'tamilnadu': 'south', 'tn': 'south',
    'kerala': 'south', 'kl': 'south',
    'andhra pradesh': 'south', 'andhra': 'south', 'ap': 'south',
    'telangana': 'south', 'ts': 'south',
    'puducherry': 'south', 'pondicherry': 'south', 'py': 'south',
    'lakshadweep': 'south', 'ld': 'south',
    'andaman': 'south', 'an': 'south',

    // North
    'delhi': 'north', 'dl': 'north',
    'haryana': 'north', 'hr': 'north',
    'punjab': 'north', 'pb': 'north',
    'himachal pradesh': 'north', 'himachal': 'north', 'hp': 'north',
    'jammu': 'north', 'kashmir': 'north', 'jk': 'north',
    'uttarakhand': 'north', 'uk': 'north',
    'uttar pradesh': 'north', 'up': 'north',
    'rajasthan': 'north', 'rj': 'north',

    // West
    'maharashtra': 'west', 'mh': 'west',
    'goa': 'west', 'ga': 'west',
    'gujarat': 'west', 'gj': 'west',
    'daman': 'west', 'diu': 'west', 'dd': 'west',

    // East
    'west bengal': 'east', 'wb': 'east',
    'bihar': 'east', 'br': 'east',
    'jharkhand': 'east', 'jh': 'east',
    'odisha': 'east', 'orissa': 'east', 'or': 'east',
    'sikkim': 'east', 'sk': 'east',
    'assam': 'east', 'as': 'east',
    'arunachal': 'east', 'arunachal pradesh': 'east', 'ar': 'east',
    'nagaland': 'east', 'nl': 'east',
    'manipur': 'east', 'mn': 'east',
    'mizoram': 'east', 'mz': 'east',
    'tripura': 'east', 'tr': 'east',
    'meghalaya': 'east', 'ml': 'east',

    // Central
    'madhya pradesh': 'central', 'mp': 'central',
    'chhattisgarh': 'central', 'cg': 'central'
  };

  const vZone = zones[vState] || Object.keys(zones).find(k => vState.includes(k) || k.includes(vState)) ? zones[vState] : null;
  const cZone = zones[cState] || Object.keys(zones).find(k => cState.includes(k) || k.includes(cState)) ? zones[cState] : null;

  if (!vZone || !cZone) return 1.0; 
  if (vZone === cZone) return 1.0; 

  const adjacencies: Record<string, string[]> = {
    'central': ['north', 'south', 'west', 'east'],
    'west': ['north', 'south', 'central'],
    'north': ['west', 'east', 'central'],
    'south': ['west', 'east', 'central'],
    'east': ['north', 'south', 'central']
  };

  if (adjacencies[vZone]?.includes(cZone)) {
    return 1.3; 
  }

  return 1.6; 
}

export function getShippingChargeForWeight(
  weightGrams: number,
  region: 'North' | 'South',
  vendor: any,
  customerState?: string
): number {
  const finalWeight = weightGrams <= 0 ? 500 : weightGrams;

  // Slabs: 500g, 1kg, 2kg, 3kg, 5kg, 10kg
  const slabLimits = [500, 1000, 2000, 3000, 5000, 10000];
  let selectedLimit = 10000;
  for (const limit of slabLimits) {
    if (finalWeight <= limit) {
      selectedLimit = limit;
      break;
    }
  }

  const key = `slab${selectedLimit >= 1000 ? (selectedLimit / 1000) + 'kg' : selectedLimit + 'g'}`;

  let baseCharge = 0;
  let hasConfigured = false;

  // If vendor is populated and has rates
  if (vendor && typeof vendor === 'object') {
    const rates = region === 'South' ? vendor.shippingRatesSouth : vendor.shippingRatesNorth;
    if (rates) {
      hasConfigured = Object.values(rates).some(v => Number(v) > 0);
      if (hasConfigured && rates[key] !== undefined && rates[key] !== null) {
        baseCharge = Number(rates[key]) || 0;
      }
    }
  }

  if (!hasConfigured) {
    // Sensible default fallback charges if rates are not configured or vendor is not populated
    const fallbacks: Record<string, number> = {
      slab500g: 80,
      slab1kg: 120,
      slab2kg: 180,
      slab3kg: 240,
      slab5kg: 350,
      slab10kg: 600
    };
    baseCharge = fallbacks[key] || 0;
  }

  // Adjust charge based on distance from vendor state to customer state
  if (customerState && vendor && typeof vendor === 'object') {
    let vendorState = '';
    if (Array.isArray(vendor.addresses)) {
      const defaultAddr = vendor.addresses.find((a: any) => a.isDefault);
      if (defaultAddr?.state) vendorState = defaultAddr.state;
      else if (vendor.addresses[0]?.state) vendorState = vendor.addresses[0].state;
    }
    if (!vendorState && vendor.state) {
      vendorState = vendor.state;
    }
    if (vendorState) {
      const multiplier = getDistanceZoneMultiplier(vendorState, customerState);
      return Math.round(baseCharge * multiplier);
    }
  }

  return baseCharge;
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