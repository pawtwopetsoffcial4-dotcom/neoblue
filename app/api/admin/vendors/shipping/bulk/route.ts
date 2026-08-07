import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/User';
import { createErrorResponse, createSuccessResponse, getTokenFromRequest, verifyToken } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const token = getTokenFromRequest(request);
    if (!token) {
      return createErrorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return createErrorResponse('Forbidden', 403);
    }

    const body = await request.json();
    const {
      actionType,
      targetScope,
      vendorIds,
      region,
      ratesNorth,
      ratesSouth,
      adjustAmount,
      adjustPercent,
      copyDirection,
      deliverNorth,
      deliverSouth,
      nonServiceableStates
    } = body;

    const query: any = { role: 'vendor' };
    if (targetScope === 'approvedOnly') {
      query.isApproved = true;
    } else if (targetScope === 'selected' && Array.isArray(vendorIds) && vendorIds.length > 0) {
      query._id = { $in: vendorIds };
    }

    const vendors = await User.find(query);
    if (!vendors || vendors.length === 0) {
      return createErrorResponse('No matching vendors found to update', 404);
    }

    const SLAB_KEYS = ['slab500g', 'slab1kg', 'slab2kg', 'slab3kg', 'slab5kg', 'slab10kg'];
    let updatedCount = 0;

    for (const vendor of vendors) {
      let isChanged = false;

      if (actionType === 'setFixed') {
        if ((region === 'North' || region === 'both') && ratesNorth) {
          vendor.shippingRatesNorth = {
            ...(vendor.shippingRatesNorth || {}),
            ...ratesNorth
          };
          isChanged = true;
        }
        if ((region === 'South' || region === 'both') && ratesSouth) {
          vendor.shippingRatesSouth = {
            ...(vendor.shippingRatesSouth || {}),
            ...ratesSouth
          };
          isChanged = true;
        }
      } else if (actionType === 'adjustAmount') {
        const delta = Number(adjustAmount) || 0;
        if (delta !== 0) {
          if (region === 'North' || region === 'both') {
            const current = vendor.shippingRatesNorth || {};
            const next: Record<string, number> = {};
            SLAB_KEYS.forEach(k => {
              const val = Number(current[k]) || 0;
              next[k] = Math.max(0, Math.round(val + delta));
            });
            vendor.shippingRatesNorth = next;
            isChanged = true;
          }
          if (region === 'South' || region === 'both') {
            const current = vendor.shippingRatesSouth || {};
            const next: Record<string, number> = {};
            SLAB_KEYS.forEach(k => {
              const val = Number(current[k]) || 0;
              next[k] = Math.max(0, Math.round(val + delta));
            });
            vendor.shippingRatesSouth = next;
            isChanged = true;
          }
        }
      } else if (actionType === 'adjustPercent') {
        const pct = Number(adjustPercent) || 0;
        if (pct !== 0) {
          const factor = 1 + (pct / 100);
          if (region === 'North' || region === 'both') {
            const current = vendor.shippingRatesNorth || {};
            const next: Record<string, number> = {};
            SLAB_KEYS.forEach(k => {
              const val = Number(current[k]) || 0;
              next[k] = Math.max(0, Math.round(val * factor));
            });
            vendor.shippingRatesNorth = next;
            isChanged = true;
          }
          if (region === 'South' || region === 'both') {
            const current = vendor.shippingRatesSouth || {};
            const next: Record<string, number> = {};
            SLAB_KEYS.forEach(k => {
              const val = Number(current[k]) || 0;
              next[k] = Math.max(0, Math.round(val * factor));
            });
            vendor.shippingRatesSouth = next;
            isChanged = true;
          }
        }
      } else if (actionType === 'copyRegion') {
        if (copyDirection === 'northToSouth') {
          vendor.shippingRatesSouth = { ...(vendor.shippingRatesNorth || {}) };
          isChanged = true;
        } else if (copyDirection === 'southToNorth') {
          vendor.shippingRatesNorth = { ...(vendor.shippingRatesSouth || {}) };
          isChanged = true;
        }
      } else if (actionType === 'toggleDelivery') {
        if (deliverNorth !== undefined) {
          vendor.deliverNorth = Boolean(deliverNorth);
          isChanged = true;
        }
        if (deliverSouth !== undefined) {
          vendor.deliverSouth = Boolean(deliverSouth);
          isChanged = true;
        }
        if (Array.isArray(nonServiceableStates)) {
          vendor.nonServiceableStates = nonServiceableStates;
          isChanged = true;
        }
      }

      if (isChanged) {
        await vendor.save();
        updatedCount++;
      }
    }

    return createSuccessResponse({
      message: `Bulk shipping rates updated successfully for ${updatedCount} vendor(s)`,
      updatedCount,
    });
  } catch (error: any) {
    console.error('Bulk vendor shipping error:', error);
    return createErrorResponse(error.message || 'Failed to update bulk shipping rates', 500);
  }
}
