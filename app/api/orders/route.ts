import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { getProductShippingCharge, getRegionFromState } from '@/lib/utils/shipping';
import { NextRequest } from 'next/server';

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;
const cashfreeEnv = process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';

const getCashfreeBaseUrl = () => (cashfreeEnv === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com');

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

    // Self-healing check for recent pending orders
    try {
      const checkTime = new Date(Date.now() - 60 * 60 * 1000); // last 1 hour
      const queryPending: any = { status: 'pending', createdAt: { $gt: checkTime } };
      if (payload.role === 'user') {
        queryPending.userId = payload.userId;
      } else if (payload.role === 'vendor') {
        queryPending.vendorId = payload.userId;
      }

      const pendingOrders = await Order.find(queryPending);
      if (pendingOrders.length > 0 && appId && secretKey) {
        const uniqueCfIds = Array.from(new Set(pendingOrders.map(o => o.cashfreeOrderId).filter(Boolean)));
        for (const cfId of uniqueCfIds) {
          const orderRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cfId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'x-client-id': appId,
              'x-client-secret': secretKey,
              'x-api-version': '2023-08-01',
            },
          });
          if (orderRes.ok) {
            const orderData = await orderRes.json();
            if (orderData.order_status === 'PAID') {
              let cfPaymentId = null;
              const paymentsRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cfId}/payments`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'x-client-id': appId,
                  'x-client-secret': secretKey,
                  'x-api-version': '2023-08-01',
                },
              });
              if (paymentsRes.ok) {
                const payments = await paymentsRes.json();
                const successPayment = Array.isArray(payments)
                  ? payments.find((p: any) => p?.payment_status === 'SUCCESS')
                  : null;
                cfPaymentId = successPayment?.cf_payment_id || null;
              }
              await Order.updateMany(
                { cashfreeOrderId: cfId },
                { status: 'placed', paymentId: cfPaymentId || cfId }
              );
            }
          }
        }
      }
    } catch (err) {
      console.error('Self-healing pending orders check failed:', err);
    }

    let query: any = {};

    if (payload.role === 'user') {
      query.userId = payload.userId;
      query.status = { $ne: 'pending' };
    } else if (payload.role === 'vendor') {
      query.vendorId = payload.userId;
      query.status = { $ne: 'pending' };
    } else if (payload.role === 'admin') {
      query.status = { $ne: 'pending' };
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
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

    if (cashfreeOrderId) {
      if (!appId || !secretKey) {
        return createErrorResponse('Cashfree keys are not configured', 500);
      }

      const orderRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cashfreeOrderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        return createErrorResponse(orderData?.message || 'Failed to verify Cashfree order payment', orderRes.status);
      }

      if (orderData.order_status !== 'PAID') {
        return createErrorResponse(`Payment not completed. Status: ${orderData.order_status}`, 400);
      }

      const existingOrders = await Order.find({ cashfreeOrderId });
      if (existingOrders.length > 0) {
        // Assert that the payment amount matches the calculated total amount of database entries
        const expectedTotal = existingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const actualPaid = Number(orderData.order_amount);
        if (Math.abs(expectedTotal - actualPaid) > 0.05) {
          return createErrorResponse(`Payment amount mismatch. Expected: ₹${expectedTotal.toFixed(2)}, Paid: ₹${actualPaid.toFixed(2)}`, 400);
        }

        const updatedOrders = [];
        for (const order of existingOrders) {
          if (order.status === 'pending') {
            order.status = 'placed';
            if (paymentId) {
              order.paymentId = paymentId;
            } else {
              order.paymentId = orderData.order_id;
            }
            await order.save();
          }
          updatedOrders.push(order);
        }
        return createSuccessResponse(
          {
            message: 'Order created successfully (retrieved existing)',
            orders: updatedOrders,
            // Backward compatibility
            order: updatedOrders[0],
          },
          201
        );
      }
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return createErrorResponse('Please provide products', 400);
    }

    if (!address) {
      return createErrorResponse('Please provide delivery address', 400);
    }

    // Validate products exist and get vendor info
    const productIds = products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).populate('vendorId');

    if (dbProducts.length !== productIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    let totalAmount = 0;
    const orderProducts = products.map((p: any) => {
      const product = dbProducts.find((dp) => dp._id.toString() === p.productId);
      if (!product) {
        throw new Error(`Product not found: ${p.productId}`);
      }
      const itemSubtotal = product.price * p.quantity;
      totalAmount += itemSubtotal;

      return {
        productId: p.productId,
        quantity: p.quantity,
        price: product.price,
        vendorId: product.vendorId.toString(),
      };
    });

    const stateName = address?.state || '';
    const region = getRegionFromState(stateName);

    // Group products by vendor to calculate shipping per vendor group
    const vendorGroups: Record<
      string,
      {
        products: Array<{ productId: string; quantity: number; price: number }>;
        subtotal: number;
        shippingAmount: number;
        totalWeight: number;
        isServiceable: boolean;
      }
    > = {};

    for (const op of dbProducts) {
      const orderItem = products.find((item: any) => item.productId === op._id.toString());
      const qty = Number(orderItem?.quantity || 0);
      const vId = op.vendorId._id ? op.vendorId._id.toString() : op.vendorId.toString();

      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          products: [],
          subtotal: 0,
          shippingAmount: 0,
          totalWeight: 0,
          isServiceable: true,
        };
      }

      vendorGroups[vId].products.push({
        productId: op._id.toString(),
        quantity: qty,
        price: op.price,
      });

      vendorGroups[vId].subtotal += op.price * qty;
      vendorGroups[vId].totalWeight += (op.weightPerPiece || 0) * qty;

      // Check if state is non-serviceable or if region delivery is disabled by vendor
      const vendorUser = op.vendorId; // populated
      const nonServiceable = vendorUser?.nonServiceableStates || [];
      if (stateName && nonServiceable.some((s: string) => s.toLowerCase().trim() === stateName.toLowerCase().trim())) {
        vendorGroups[vId].isServiceable = false;
      }
      if (region === 'North' && vendorUser?.deliverNorth === false) {
        vendorGroups[vId].isServiceable = false;
      }
      if (region === 'South' && vendorUser?.deliverSouth === false) {
        vendorGroups[vId].isServiceable = false;
      }
    }

    // Now compute shipping per vendor group and get total shippingAmount
    let shippingAmount = 0;
    for (const [vId, group] of Object.entries(vendorGroups)) {
      if (!group.isServiceable) {
        return createErrorResponse(`Sorry, this product cannot be delivered to your location.`, 400);
      }

      let groupShipping = 0;
      for (const gp of group.products) {
        const productDoc = dbProducts.find((p) => p._id.toString() === gp.productId);
        groupShipping += getProductShippingCharge(productDoc, gp.quantity, stateName);
      }
      group.shippingAmount = groupShipping;
      shippingAmount += groupShipping;
    }

    // Verify cashfree payment if Cashfree is used
    if (cashfreeOrderId) {
      if (!appId || !secretKey) {
        return createErrorResponse('Cashfree keys are not configured', 500);
      }

      const orderRes = await fetch(`${getCashfreeBaseUrl()}/pg/orders/${cashfreeOrderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'x-api-version': '2023-08-01',
        },
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        return createErrorResponse(orderData?.message || 'Failed to verify Cashfree order payment', orderRes.status);
      }

      if (orderData.order_status !== 'PAID') {
        return createErrorResponse(`Payment not completed. Status: ${orderData.order_status}`, 400);
      }

      // Assert that the payment amount matches the calculated total amount (with dynamic tolerance for rounding)
      const expectedTotal = totalAmount + shippingAmount;
      const actualPaid = Number(orderData.order_amount);
      if (Math.abs(expectedTotal - actualPaid) > 0.05) {
        return createErrorResponse(`Payment amount mismatch. Expected: ₹${expectedTotal.toFixed(2)}, Paid: ₹${actualPaid.toFixed(2)}`, 400);
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        return createErrorResponse('Payment verification identifier (cashfreeOrderId) is required', 400);
      }
    }

    // Create order for each vendor
    const createdOrders = [];
    for (const [vId, group] of Object.entries(vendorGroups)) {
      const order = await Order.create({
        userId: payload.userId,
        vendorId: vId,
        products: group.products,
        totalAmount: group.subtotal + group.shippingAmount,
        shippingAmount: group.shippingAmount,
        address,
        paymentId,
        razorpayOrderId,
        cashfreeOrderId,
        status: 'placed',
      });
      createdOrders.push(order);
    }

    return createSuccessResponse(
      {
        message: 'Order created successfully',
        orders: createdOrders,
        // Backward compatibility
        order: createdOrders[0],
      },
      201
    );
  } catch (error: any) {
    console.error('Create order error:', error);
    return createErrorResponse(error.message || 'Failed to create order', 500);
  }
}
