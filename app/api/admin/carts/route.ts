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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // 15-day expiration cutoff
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    // Asynchronously purge expired (>15d) or empty carts
    Cart.deleteMany({
      $or: [
        { updatedAt: { $lt: fifteenDaysAgo } },
        { items: { $size: 0 } },
        { items: null },
      ],
    }).catch(() => {});

    const baseFilter = {
      'items.0': { $exists: true },
      updatedAt: { $gte: fifteenDaysAgo },
    };

    // Concurrently fetch page items AND overall aggregation statistics across ALL active carts
    const [rawCarts, statsAgg] = await Promise.all([
      Cart.find(baseFilter)
        .populate('userId', 'name email phone createdAt')
        .populate('items.productId', 'title images price category perPairPrice weightPerPiece slug isTrending')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Cart.aggregate([
        {
          $match: baseFilter,
        },
        {
          $project: {
            itemsCount: { $sum: '$items.quantity' },
            cartValue: {
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: {
                    $multiply: [
                      { $ifNull: ['$$item.price', 0] },
                      { $ifNull: ['$$item.quantity', 1] },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalCarts: { $sum: 1 },
            totalPotentialValue: { $sum: '$cartValue' },
            totalProducts: { $sum: '$itemsCount' },
          },
        },
      ]),
    ]);

    const globalStats = statsAgg[0] || {
      totalCarts: 0,
      totalPotentialValue: 0,
      totalProducts: 0,
    };
    const totalActiveCarts = globalStats.totalCarts;
    const avgValue = totalActiveCarts > 0 ? Math.round(globalStats.totalPotentialValue / totalActiveCarts) : 0;

    // Cross-reference recent orders ONLY for the users on this page
    const userIds = rawCarts.map((c: any) => c.userId?._id).filter(Boolean);
    const userOrders = userIds.length > 0
      ? await Order.find({ userId: { $in: userIds } }).sort({ createdAt: -1 }).lean()
      : [];

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
          // it means this cart was checked out and should be deleted from DB!
          if (latestPlacedOrder) {
            const orderTime = new Date(latestPlacedOrder.createdAt).getTime();
            if (orderTime >= cartUpdatedTime - 10 * 60 * 1000) {
              // Delete checked out cart from DB
              Cart.deleteOne({ _id: cart._id }).catch(() => {});
              return null;
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
      totalActiveCarts,
      page,
      totalPages: Math.ceil(totalActiveCarts / limit),
      hasMore: skip + rawCarts.length < totalActiveCarts,
      totalCartValue: globalStats.totalPotentialValue,
      totalProducts: globalStats.totalProducts,
      avgValue,
      stats: {
        totalCarts: totalActiveCarts,
        totalPotentialValue: globalStats.totalPotentialValue,
        totalProducts: globalStats.totalProducts,
        avgValue,
      },
    });
  } catch (error: any) {
    console.error('Fetch admin carts error:', error);
    return createErrorResponse(error.message || 'Failed to fetch cart leads', 500);
  }
}
