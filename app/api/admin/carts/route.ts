import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Cart from '@/lib/models/Cart';
import Order from '@/lib/models/Order';
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
    const rawCarts = await Cart.find({ 'items.0': { $exists: true } })
      .populate('userId', 'name email phone createdAt')
      .populate('items.productId', 'title images price category perPairPrice weightPerPiece slug isTrending')
      .sort({ updatedAt: -1 })
      .lean();

    // Get user IDs to cross-reference recent orders
    const userIds = rawCarts.map((c: any) => c.userId?._id).filter(Boolean);
    const userOrders = await Order.find({
      userId: { $in: userIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Group orders by user ID
    const ordersByUser: Record<string, any[]> = {};
    for (const o of userOrders) {
      const uId = o.userId?.toString();
      if (!ordersByUser[uId]) ordersByUser[uId] = [];
      ordersByUser[uId].push(o);
    }

    const formattedCarts = (
      await Promise.all(
        rawCarts.map(async (cart: any) => {
          const user = cart.userId;
          if (!user) return null;

          const uId = user._id?.toString();
          const orders = ordersByUser[uId] || [];

          // Find if user has placed an order recently (or since cart was created/updated)
          const latestPlacedOrder = orders.find(
            (o) => o.status && o.status !== 'pending' && o.status !== 'cancelled'
          );

          const cartUpdatedTime = new Date(cart.updatedAt || cart.createdAt).getTime();

          // If the user already has a placed order and the cart wasn't updated significantly after the order,
          // it means this cart was checked out and should be cleared / excluded from abandoned carts!
          if (latestPlacedOrder) {
            const orderTime = new Date(latestPlacedOrder.createdAt).getTime();
            // If order was created around or after cart (or cart hasn't been re-added to after order)
            if (orderTime >= cartUpdatedTime - 10 * 60 * 1000) {
              // Auto-clean this cart in DB in background so it doesn't linger
              Cart.updateOne({ _id: cart._id }, { $set: { items: [] } }).catch(() => {});
              return null; // Don't show already purchased orders in abandoned leads!
            }
          }

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
            latestOrder: latestPlacedOrder
              ? {
                  id: latestPlacedOrder._id.toString(),
                  status: latestPlacedOrder.status,
                  createdAt: latestPlacedOrder.createdAt,
                  totalAmount: latestPlacedOrder.totalAmount,
                }
              : null,
          };
        })
      )
    ).filter(Boolean);

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
