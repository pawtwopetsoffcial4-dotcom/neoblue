import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import '@/lib/models/User';
import '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'employee')) {
      return createErrorResponse('Forbidden: Admin access required', 403);
    }

    // Fetch all carts that have at least 1 item
    const carts = await Cart.find({ 'items.0': { $exists: true } })
      .populate('userId', 'name email phone createdAt')
      .populate('items.productId', 'title images price category perPairPrice weightPerPiece slug isTrending')
      .sort({ updatedAt: -1 })
      .lean();

    const formattedCarts = carts
      .map((cart: any) => {
        const user = cart.userId;
        if (!user) return null;

        const validItems = (cart.items || [])
          .map((item: any) => {
            const prod = item.productId;
            if (!prod) return null;

            const packQty = Number(item.packQty) || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : 1);
            const unitLabel = item.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (prod.perPairPrice != null ? 'pair' : 'piece'));
            
            const basePrice = Number(prod.price) || 0;
            let itemPrice = basePrice;
            if (packQty > 1) {
              const discount = packQty === 6 ? 0.10 : packQty === 3 ? 0.05 : 0;
              itemPrice = Math.round(basePrice * packQty * (1 - discount));
            }

            return {
              productId: prod._id?.toString() || '',
              title: prod.title || 'Untitled Product',
              image: prod.images?.[0] || '/illustrations/placeholder.png',
              price: itemPrice,
              quantity: item.quantity || 1,
              packQty,
              unitLabel,
              category: prod.category || 'Aquatic',
              slug: prod.slug || '',
              itemTotal: itemPrice * (item.quantity || 1),
            };
          })
          .filter(Boolean);

        if (validItems.length === 0) return null;

        const totalCartValue = validItems.reduce((sum: number, it: any) => sum + it.itemTotal, 0);
        const totalItemsCount = validItems.reduce((sum: number, it: any) => sum + it.quantity, 0);

        return {
          cartId: cart._id.toString(),
          user: {
            id: user._id?.toString(),
            name: user.name || 'Anonymous Guest',
            email: user.email || '',
            phone: user.phone || '',
            joinedAt: user.createdAt,
          },
          items: validItems,
          totalCartValue,
          totalItemsCount,
          updatedAt: cart.updatedAt || cart.createdAt,
          createdAt: cart.createdAt,
        };
      })
      .filter(Boolean);

    return createSuccessResponse({
      carts: formattedCarts,
      totalActiveCarts: formattedCarts.length,
      totalCartValue: formattedCarts.reduce((sum: number, c: any) => sum + c.totalCartValue, 0),
    });
  } catch (error: any) {
    console.error('Fetch admin carts error:', error);
    return createErrorResponse(error.message || 'Failed to fetch cart leads', 500);
  }
}
