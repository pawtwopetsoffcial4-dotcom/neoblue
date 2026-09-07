import { connectDB } from '@/lib/db';
import Order from '@/lib/models/Order';
import Product from '@/lib/models/Product';
import StoreConfig from '@/lib/models/StoreConfig';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { getProductShippingCharge, getRegionFromState } from '@/lib/utils/shipping';
import { decrementStockForOrder } from '@/lib/utils/stock';
import { createNotification } from '@/lib/utils/notifications';
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
              const ordersToUpdate = await Order.find({ cashfreeOrderId: cfId });
              for (const order of ordersToUpdate) {
                if (order.status !== 'placed') {
                  order.status = 'placed';
                  order.paymentId = cfPaymentId || cfId;
                  await decrementStockForOrder(order);
                }
              }
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

            // Trigger notification for the buyer
            await createNotification(
              order.userId,
              'Order Placed',
              `Your order #${order._id.toString().toUpperCase().slice(-6)} has been placed successfully.`,
              'order_status',
              '/orders'
            );

            // Trigger notification for the vendor
            await createNotification(
              order.vendorId,
              'New Order Received',
              `You have received a new order #${order._id.toString().toUpperCase().slice(-6)} for ₹${order.totalAmount.toFixed(2)}.`,
              'new_order',
              '/vendor/orders'
            );
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
    const productIds = products.map((product: any) => {
      const id = String(product.productId || '');
      return id.includes('_pack_') ? id.split('_pack_')[0] : (id.includes('-pack-') ? id.split('-pack-')[0] : id);
    });
    const uniqueProductIds = Array.from(new Set(productIds));
    const dbProducts = await Product.find({ _id: { $in: uniqueProductIds } }).populate('vendorId');

    if (dbProducts.length !== uniqueProductIds.length) {
      return createErrorResponse('Some products not found', 404);
    }

    let totalAmount = 0;
    const orderProducts = products.map((item: any) => {
      const rawId = String(item.productId || '');
      const cleanId = rawId.includes('_pack_') ? rawId.split('_pack_')[0] : (rawId.includes('-pack-') ? rawId.split('-pack-')[0] : rawId);
      const product = dbProducts.find((entry) => entry._id.toString() === cleanId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const packQty = Number(item.packQty) || (item.unitLabel?.startsWith('Pack of ') ? parseInt(item.unitLabel.replace('Pack of ', ''), 10) : (rawId.includes('_pack_') ? parseInt(rawId.split('_pack_')[1], 10) : 1));
      const unitLabel = item.unitLabel || (packQty > 1 ? `Pack of ${packQty}` : (product.perPairPrice != null ? 'pair' : 'piece'));

      let itemPrice = Number(product.price);
      if (item.price != null && Number(item.price) > 0) {
        itemPrice = Number(item.price);
      } else if (packQty > 1) {
        const discount = packQty === 6 ? 0.10 : packQty === 3 ? 0.05 : 0;
        itemPrice = Math.round(product.price * packQty * (1 - discount));
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const itemSubtotal = itemPrice * qty;
      totalAmount += itemSubtotal;

      const vendorIdStr = typeof product.vendorId === 'object' && product.vendorId !== null
        ? ((product.vendorId as any)._id?.toString() || (product.vendorId as any).id?.toString() || String(product.vendorId))
        : String(product.vendorId);

      return {
        productId: product._id.toString(),
        quantity: qty,
        price: itemPrice,
        unitLabel,
        packQty,
        vendorId: vendorIdStr,
      };
    });

    const stateName = address?.state || '';
    const region = getRegionFromState(stateName);

    // Group products by vendor to calculate shipping per vendor group
    const vendorGroups: Record<
      string,
      {
        products: Array<{ 
          productId: string; 
          quantity: number; 
          price: number;
          unitLabel?: string;
          packQty?: number;
        }>;
        subtotal: number;
        shippingAmount: number;
        totalWeight: number;
        isServiceable: boolean;
      }
    > = {};

    for (const op of orderProducts) {
      const productDoc = dbProducts.find((p) => p._id.toString() === op.productId);
      if (!productDoc) continue;

      const vId = op.vendorId;
      const qty = Math.max(1, Number(op.quantity) || 1);
      const packMultiplier = op.packQty || (op.unitLabel?.startsWith('Pack of ') ? parseInt(op.unitLabel.replace('Pack of ', ''), 10) : 1);
      const singleWeight = productDoc.weightPerPiece || (productDoc.category === 'Plants' ? 80 : 100);

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
        productId: op.productId,
        quantity: qty,
        price: op.price,
        unitLabel: op.unitLabel,
        packQty: op.packQty,
      });

      vendorGroups[vId].subtotal += op.price * qty;
      vendorGroups[vId].totalWeight += singleWeight * packMultiplier * qty;

      // Check if state is non-serviceable or if region delivery is disabled by vendor
      const vendorUser = productDoc.vendorId as any;
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
        const packMultiplier = (gp as any).packQty || ((gp as any).unitLabel?.startsWith('Pack of ') ? parseInt((gp as any).unitLabel.replace('Pack of ', ''), 10) : 1);
        const effectiveQty = gp.quantity * packMultiplier;
        groupShipping += getProductShippingCharge(productDoc, effectiveQty, stateName);
      }
      group.shippingAmount = groupShipping;
      shippingAmount += groupShipping;
    }

    const storeConfig = await StoreConfig.findOne({}).lean();
    const freeShippingEnabled = (storeConfig as any)?.freeShippingEnabled !== false;
    const freeShippingMin = Number((storeConfig as any)?.freeShippingMinAmount) || 599;

    if (freeShippingEnabled && totalAmount >= freeShippingMin) {
      shippingAmount = 0;
      for (const vId of Object.keys(vendorGroups)) {
        vendorGroups[vId].shippingAmount = 0;
      }
    } else if (shippingAmount === 0 && totalAmount < freeShippingMin) {
      shippingAmount = 99;
      const firstVendorKey = Object.keys(vendorGroups)[0];
      if (firstVendorKey && vendorGroups[firstVendorKey]) {
        vendorGroups[firstVendorKey].shippingAmount = 99;
      }
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
      await decrementStockForOrder(order);
      createdOrders.push(order);

      // Trigger notification for the buyer
      await createNotification(
        order.userId,
        'Order Placed',
        `Your order #${order._id.toString().toUpperCase().slice(-6)} has been placed successfully.`,
        'order_status',
        '/orders'
      );

      // Trigger notification for the vendor
      await createNotification(
        order.vendorId,
        'New Order Received',
        `You have received a new order #${order._id.toString().toUpperCase().slice(-6)} for ₹${order.totalAmount.toFixed(2)}.`,
        'new_order',
        '/vendor/orders'
      );
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
