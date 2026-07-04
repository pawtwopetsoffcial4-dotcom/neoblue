import Product from '@/lib/models/Product';

/**
 * Decrements the stockQuantity and increments the soldQuantity for all products in a paid/placed order.
 * Ensures stockDecremented flag is set on the order to prevent duplicate decrements.
 */
export async function decrementStockForOrder(order: any) {
  if (!order || order.status !== 'placed' || order.stockDecremented) {
    return;
  }

  try {
    for (const item of order.products) {
      if (!item.productId) continue;

      const product = await Product.findById(item.productId);
      if (product) {
        // If the product has a stockQuantity set (or default to 0)
        const currentStock = product.stockQuantity || 0;
        const nextStock = Math.max(0, currentStock - item.quantity);
        product.stockQuantity = nextStock;
        
        // Increment total sold units
        product.soldQuantity = (product.soldQuantity || 0) + item.quantity;

        // Auto toggle inStock flag
        if (nextStock <= 0) {
          product.inStock = false;
        }

        await product.save();
      }
    }

    // Set flag to prevent double-decrementing stock
    order.stockDecremented = true;
    await order.save();
  } catch (error) {
    console.error(`Failed to decrement stock for order ${order._id}:`, error);
  }
}
