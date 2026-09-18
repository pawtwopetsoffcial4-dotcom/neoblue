const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

// Fixed default package dimensions (cm) used for every shipment.
// Real per-piece weight is still sent dynamically; only the box size is a flat default.
const DEFAULT_LENGTH_CM = 15;
const DEFAULT_BREADTH_CM = 15;
const DEFAULT_HEIGHT_CM = 15;
const MIN_WEIGHT_KG = 0.1;

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedPickupLocation: { name: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD)');
  }

  const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data?.token) {
    throw new Error(`Shiprocket login failed: ${data?.message || res.statusText}`);
  }

  // Token is valid for 10 days; refresh a little early.
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
  return cachedToken.token;
}

async function getPickupLocationName(): Promise<string> {
  if (cachedPickupLocation && cachedPickupLocation.expiresAt > Date.now()) {
    return cachedPickupLocation.name;
  }

  const configured = process.env.SHIPROCKET_PICKUP_LOCATION;
  if (configured) {
    cachedPickupLocation = { name: configured, expiresAt: Date.now() + 60 * 60 * 1000 };
    return configured;
  }

  const token = await getShiprocketToken();
  const res = await fetch(`${SHIPROCKET_BASE_URL}/settings/company/pickup`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const addresses = data?.data?.shipping_address;
  if (!res.ok || !Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('No Shiprocket pickup location found. Register one in the Shiprocket dashboard or set SHIPROCKET_PICKUP_LOCATION.');
  }

  const primary = addresses.find((a: { is_primary_location?: number }) => a?.is_primary_location === 1) || addresses[0];
  const name = primary?.pickup_location;
  if (!name) {
    throw new Error('Shiprocket pickup location has no nickname set.');
  }

  cachedPickupLocation = { name, expiresAt: Date.now() + 60 * 60 * 1000 };
  return name;
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number;
}

export interface ShiprocketOrderInput {
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: { street: string; city: string; state: string; zipcode: string };
  items: ShiprocketOrderItem[];
  subTotal: number;
  totalWeightGrams: number;
}

export interface ShiprocketOrderResult {
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
}

function formatOrderDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export async function createShiprocketOrder(input: ShiprocketOrderInput): Promise<ShiprocketOrderResult> {
  const token = await getShiprocketToken();
  const pickupLocation = await getPickupLocationName();

  const [firstName, ...rest] = input.customerName.trim().split(' ');
  const lastName = rest.join(' ') || firstName;

  const weightKg = Math.max(MIN_WEIGHT_KG, input.totalWeightGrams / 1000);

  const payload = {
    order_id: input.orderId,
    order_date: formatOrderDate(input.orderDate),
    pickup_location: pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: input.address.street,
    billing_city: input.address.city,
    billing_pincode: input.address.zipcode,
    billing_state: input.address.state,
    billing_country: 'India',
    billing_email: input.customerEmail,
    billing_phone: input.customerPhone,
    shipping_is_billing: true,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku,
      units: item.units,
      selling_price: item.sellingPrice,
    })),
    payment_method: 'Prepaid',
    sub_total: input.subTotal,
    length: DEFAULT_LENGTH_CM,
    breadth: DEFAULT_BREADTH_CM,
    height: DEFAULT_HEIGHT_CM,
    weight: weightKg,
  };

  const res = await fetch(`${SHIPROCKET_BASE_URL}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || data?.status_code === 0 || !data?.order_id) {
    throw new Error(`Shiprocket order creation failed: ${data?.message || res.statusText}`);
  }

  return {
    shiprocketOrderId: String(data.order_id),
    shiprocketShipmentId: String(data.shipment_id),
  };
}
