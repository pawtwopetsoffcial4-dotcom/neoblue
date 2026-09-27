import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

const CART_PRODUCT_FIELDS =
  'title price images category waterType scientific perPairPrice weightPerPiece originalPrice discountPercentage inStock vendorId';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    if (itemsInput.length === 0) {
      return createSuccessResponse({ items: [] });
    }

    // Extract product IDs
    const cleanIds: string[] = [];

    itemsInput.forEach((item: any) => {
      if (!item || !item.productId) return;
      const rawId = String(item.productId);
      const cleanId = rawId.includes('_pack_')
        ? rawId.split('_pack_')[0]
        : rawId.includes('-pack-')
        ? rawId.split('-pack-')[0]
        : rawId;

      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        cleanIds.push(cleanId);
      }
    });

    const uniqueCleanIds = Array.from(new Set(cleanIds));
    const products = await Product.find({ _id: { $in: uniqueCleanIds } })
      .select(CART_PRODUCT_FIELDS)
      .populate('vendorId', 'name')
      .lean();

    const productMap = new Map<string, any>();
    products.forEach((p: any) => {
      productMap.set(p._id.toString(), p);
    });

    const refreshedItems = itemsInput
      .map((item: any) => {
        if (!item || !item.productId) return null;
        const rawId = String(item.productId);
        const cleanId = rawId.includes('_pack_')
          ? rawId.split('_pack_')[0]
          : rawId.includes('-pack-')
          ? rawId.split('-pack-')[0]
          : rawId;

        const prod = productMap.get(cleanId);
        if (!prod || prod.inStock === false) return null;

        const packQty = Number(item.packQty)
          || (rawId.includes('_pack_') ? parseInt(rawId.split('_pack_')[1], 10) : 1)
          || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1);
        const isPair = item.unitLabel === 'pair' || prod.perPairPrice != null;
        const unitLabel = item.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (isPair ? 'pair' : 'piece'));

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
        const vendorName = typeof prod.vendorId === 'object' && prod.vendorId !== null
          ? (prod.vendorId as any).name
          : item.vendorName;

        return {
          productId: itemKey,
          title: prod.title,
          price: itemPrice,
          image: prod.images?.[0] ?? item.image ?? '/illustrations/placeholder.png',
          quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
          packQty,
          perPairPrice: prod.perPairPrice ?? null,
          unitLabel,
          weightPerPiece,
          category: prod.category,
          waterType: prod.waterType,
          scientific: prod.scientific,
          originalPrice: prod.originalPrice ? prod.originalPrice * packQty : basePrice * packQty,
          discountPercentage: packQty === 6 ? 10 : packQty === 3 ? 5 : (prod.discountPercentage || 0),
          inStock: true,
          vendorId: vendorId || item.vendorId,
          vendorName,
        };
      })
      .filter(Boolean);

    return createSuccessResponse({ items: refreshedItems });
  } catch (error: any) {
    console.error('Refresh cart error:', error);
    return createErrorResponse(error.message || 'Failed to refresh cart items', 500);
  }
}
