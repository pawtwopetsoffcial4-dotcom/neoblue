import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import Claim from '@/lib/models/Claim';
import Order from '@/lib/models/Order';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';
import { createNotification } from '@/lib/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'user') {
      return createErrorResponse('Only buyers can file DOA claims', 403);
    }

    const { orderId, products, proofUrls, description } = await request.json();

    if (!orderId) {
      return createErrorResponse('Order ID is required', 400);
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return createErrorResponse('Please specify at least one product being claimed', 400);
    }

    if (!proofUrls || !Array.isArray(proofUrls) || proofUrls.length === 0) {
      return createErrorResponse('At least one proof unboxing video is required', 400);
    }

    // Strict validation for mandatory unboxing video proof
    const hasVideo = proofUrls.some(url => 
      url.toLowerCase().includes('/video/') || 
      /\.(mp4|mov|avi|webm|mkv|3gp|wmv)($|\?)/i.test(url)
    );
    if (!hasVideo) {
      return createErrorResponse('An unboxing video is required as proof.', 400);
    }

    // Retrieve order
    const order = await Order.findById(orderId);
    if (!order) {
      return createErrorResponse('Order not found', 404);
    }

    if (order.userId.toString() !== payload.userId) {
      return createErrorResponse('You can only file claims for your own orders', 403);
    }

    if (order.status !== 'completed') {
      return createErrorResponse('Claims can only be filed for completed/delivered orders', 400);
    }

    // Check 6-hour window (default fallback to updatedAt if completedAt is missing)
    const completionTime = order.completedAt ? new Date(order.completedAt) : new Date(order.updatedAt);
    const hoursElapsed = (Date.now() - completionTime.getTime()) / (1000 * 60 * 60);

    if (hoursElapsed > 6) {
      return createErrorResponse('The 6-hour eligibility window for Live Arrival Guarantee has expired.', 400);
    }

    // Check if claim already exists
    const existingClaim = await Claim.findOne({ orderId });
    if (existingClaim) {
      return createErrorResponse('A claim has already been filed for this order.', 400);
    }

    // Validate claimed items match items in the order and quantities don't exceed ordered amounts
    const claimedItems = [];
    for (const item of products) {
      const orderProduct = order.products.find((op: any) => op.productId.toString() === item.productId);
      if (!orderProduct) {
        return createErrorResponse(`Product with ID ${item.productId} was not found in this order`, 400);
      }
      if (item.quantity > orderProduct.quantity) {
        return createErrorResponse(`Claimed quantity for product ${item.productId} exceeds the ordered quantity`, 400);
      }
      claimedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        reason: item.reason || 'Dead on Arrival (DOA)',
      });
    }

    // Create the claim
    const claim = await Claim.create({
      orderId,
      userId: payload.userId,
      vendorId: order.vendorId,
      products: claimedItems,
      proofUrls,
      description,
      status: 'pending',
    });

    // Trigger notification for the vendor
    await createNotification(
      order.vendorId,
      'New DOA Claim Filed!',
      `A buyer has filed a DOA claim for Order #${orderId.toUpperCase().slice(-6)}.`,
      'claim',
      '/vendor/claims'
    );

    // Trigger notification for the buyer
    await createNotification(
      payload.userId,
      'DOA Claim Submitted',
      `Your DOA claim for Order #${orderId.toUpperCase().slice(-6)} has been submitted successfully.`,
      'claim',
      '/profile'
    );

    return createSuccessResponse(
      {
        message: 'DOA claim filed successfully',
        claim,
      },
      201
    );
  } catch (error: any) {
    console.error('Create claim error:', error);
    return createErrorResponse(error.message || 'Failed to file claim', 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

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
    // Admins can see all claims

    const claims = await Claim.find(query)
      .populate('orderId', 'status totalAmount completedAt createdAt')
      .populate('userId', 'name email')
      .populate('vendorId', 'name email')
      .populate('products.productId', 'title price')
      .sort({ createdAt: -1 });

    return createSuccessResponse({ claims });
  } catch (error: any) {
    console.error('Fetch claims error:', error);
    return createErrorResponse(error.message || 'Failed to fetch claims', 500);
  }
}
