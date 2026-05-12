import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { calculateShippingAmount } from '@/lib/utils/shipping';
import { NextRequest } from 'next/server';

// GET orders (user sees their orders, vendor sees their vendor orders, admin sees all)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return createErrorResponse('Invalid token', 401);
    }

    let query: any = {};

    if (payload.role === 'user') {
      query.userId = payload.userId;
    } else if (payload.role === 'vendor') {
      query.vendorId = payload.userId;
    }
    // Admin sees all orders

    const orders = await Order.find(query)
      .populate('userId', 'name email')
      .populate('vendorId', 'name email')
      .populate('products.productId', 'title price')
      .sort({ createdAt: -1 });

    return createSuccessResponse({ orders });
  } catch (error: any) {
    console.error('Get orders error:', error);
    return createErrorResponse(error.message || 'Failed to fetch orders', 500);
  }
}

// POST create order
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check authentication
    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'user') {
      return createErrorResponse('Only users can create orders', 403);
    }

    const { products, address, paymentId, razorpayOrderId, cashfreeOrderId } = await request.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return createErrorResponse('Please provide products', 400);
    }

    if (!address) {
      return createErrorResponse('Please provide delivery address', 400);
    }

    // Validate products exist and get vendor info
    const productIds = products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    if (dbProducts.length !== productIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    const storeConfig = await StoreConfig.findOne({});
    if (!storeConfig) {
      return createErrorResponse('Shipping configuration is not available', 500);
    }

    let totalAmount = 0;
    const cartQuantity = products.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
    const orderProducts = products.map((p: any) => {
      const product = dbProducts.find((dp) => dp._id.toString() === p.productId);
      totalAmount += product.price * p.quantity;
      return {
        productId: p.productId,
        quantity: p.quantity,
        price: product.price,
      };
    });

    // For now, assume all products from same vendor (simplify)
    const vendorId = dbProducts[0].vendorId;
    const shippingAmount = calculateShippingAmount(cartQuantity, storeConfig.shippingPerPiece, storeConfig.shippingPerWeight);

    // Create order
    const order = await Order.create({
      userId: payload.userId,
      vendorId,
      products: orderProducts,
      totalAmount: totalAmount + shippingAmount,
      shippingAmount,
      address,
      paymentId,
      razorpayOrderId,
      cashfreeOrderId,
      status: 'placed',
    });

    return createSuccessResponse(
      {
        message: 'Order created successfully',
        order,
      },
      201
    );
  } catch (error: any) {
    console.error('Create order error:', error);
    return createErrorResponse(error.message || 'Failed to create order', 500);
  }
}
