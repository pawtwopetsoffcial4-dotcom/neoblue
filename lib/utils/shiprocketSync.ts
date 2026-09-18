import { HydratedDocument } from 'mongoose';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import { IOrder } from '@/lib/models/Order';
import { createShiprocketOrder, ShiprocketOrderItem } from '@/lib/shiprocket';

/**
 * Pushes a placed order to Shiprocket and records the result on the order.
 * Never throws — a Shiprocket outage must not block order placement.
 */
export async function syncOrderToShiprocket(order: HydratedDocument<IOrder>): Promise<void> {
  if (order.shiprocketSyncStatus === 'synced') {
    return;
  }

  try {
    const customer = await User.findById(order.userId)
      .select('name email')
      .lean<{ name?: string; email?: string } | null>();
    const productIds = order.products.map((p) => p.productId);
    const dbProducts = await Product.find({ _id: { $in: productIds } }).select('title weightPerPiece category');

    let totalWeightGrams = 0;
    const items: ShiprocketOrderItem[] = order.products.map((item) => {
      const product = dbProducts.find((p) => p._id.toString() === item.productId.toString());
      const singleWeight = product?.weightPerPiece || (product?.category === 'Plants' ? 80 : 100);
      totalWeightGrams += singleWeight * item.quantity;

      return {
        name: product?.title || 'Product',
        sku: item.productId.toString(),
        units: item.quantity,
        sellingPrice: item.price,
      };
    });

    const result = await createShiprocketOrder({
      orderId: order._id.toString(),
      orderDate: order.createdAt || new Date(),
      customerName: customer?.name || 'Customer',
      customerEmail: customer?.email || '',
      customerPhone: order.address.phone,
      address: order.address,
      items,
      subTotal: order.totalAmount,
      totalWeightGrams,
    });

    order.shiprocketOrderId = result.shiprocketOrderId;
    order.shiprocketShipmentId = result.shiprocketShipmentId;
    order.shiprocketSyncStatus = 'synced';
    order.shiprocketError = undefined;
    await order.save();
  } catch (error) {
    console.error(`Shiprocket sync failed for order ${order._id}:`, error);
    order.shiprocketSyncStatus = 'failed';
    order.shiprocketError = error instanceof Error ? error.message : 'Unknown error';
    await order.save().catch(() => {});
  }
}
