import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

// Single source of truth for the product fields formatCartItem() below reads.
// Add a field here whenever formatCartItem() starts reading a new prod.<field> — otherwise it silently comes back undefined.
const CART_PRODUCT_FIELDS =
  'title price images category waterType scientific perPairPrice weightPerPiece originalPrice discountPercentage inStock vendorId';

function formatCartItem(item: any) {
  const prod = item.productId;
  if (!prod || prod.inStock === false) return null;
  const packQty = Number(item.packQty) || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1);
  const isPair = item.unitLabel === 'pair' || prod.perPairPrice != null;
  const unitLabel = item.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (isPair ? 'pair' : 'piece'));
  
  // Calculate price dynamically from live product in DB
  const basePrice = Number(prod.price) || 0;
  let itemPrice = basePrice;
  if (packQty > 1) {
    const discount = packQty === 6 ? 0.10 : packQty === 3 ? 0.05 : 0;
    itemPrice = Math.round(basePrice * packQty * (1 - discount));
  }

  const baseWeight = prod.weightPerPiece && prod.weightPerPiece > 0
    ? prod.weightPerPiece
    : (prod.category === 'Plants' ? 80 : 100);
  const weightPerPiece = baseWeight * packQty;
  const itemKey = packQty > 1 ? `${prod._id.toString()}_pack_${packQty}` : prod._id.toString();

  const vendorId = typeof prod.vendorId === 'object' && prod.vendorId !== null
    ? prod.vendorId._id?.toString() || prod.vendorId.toString()
    : prod.vendorId?.toString();

  return {
    productId: itemKey,
    title: prod.title,
    price: itemPrice,
    image: prod.images?.[0] ?? '/illustrations/placeholder.png',
    quantity: item.quantity,
    packQty,
    perPairPrice: prod.perPairPrice ?? null,
    unitLabel,
    weightPerPiece,
    category: prod.category,
    waterType: prod.waterType,
    scientific: prod.scientific,
    originalPrice: prod.originalPrice ? prod.originalPrice * packQty : basePrice * packQty,
    discountPercentage: packQty === 6 ? 10 : packQty === 3 ? 5 : (prod.discountPercentage || 0),
    vendorId,
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    let userId = request.headers.get('x-user-id');
    if (!userId) {
      const token = getTokenFromRequest(request);
      if (token) {
        const payload = verifyToken(token);
        if (payload?.userId) {
          userId = payload.userId;
        }
      }
    }
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId', CART_PRODUCT_FIELDS);

    if (!cart) {
      return createSuccessResponse({ items: [] });
    }

    const formattedItems = cart.items
      .map(formatCartItem)
      .filter(Boolean);

    return createSuccessResponse({ items: formattedItems });
  } catch (error: any) {
    console.warn('Fetch cart error (returning empty items):', error?.message);
    return createSuccessResponse({ items: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    let userId = request.headers.get('x-user-id');
    if (!userId) {
      const token = getTokenFromRequest(request);
      if (token) {
        const payload = verifyToken(token);
        if (payload?.userId) {
          userId = payload.userId;
        }
      }
    }
    if (!userId) {
      return createErrorResponse('Unauthorized', 401);
    }

    const body = await request.json();
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    // Filter and sanitize input items
    const sanitizedItems = itemsInput
      .filter((item: any) => item && typeof item.productId === 'string' && typeof item.quantity === 'number')
      .map((item: any) => {
        const rawId = String(item.productId);
        const cleanId = rawId.includes('_pack_') ? rawId.split('_pack_')[0] : (rawId.includes('-pack-') ? rawId.split('-pack-')[0] : rawId);
        const packQty = Number(item.packQty) || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1);
        
        return {
          productId: cleanId,
          quantity: Math.max(1, Math.floor(item.quantity)),
          unitLabel: item.unitLabel,
          packQty: packQty > 1 ? packQty : undefined,
          price: item.price ? Number(item.price) : undefined,
        };
      });

    // Update or insert the cart
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: sanitizedItems },
      { new: true, upsert: true }
    ).populate('items.productId', CART_PRODUCT_FIELDS);

    const formattedItems = cart.items
      .map(formatCartItem)
      .filter(Boolean);

    return createSuccessResponse({ items: formattedItems });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return createErrorResponse(error.message || 'Failed to update cart', 500);
  }
}
