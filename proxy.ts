import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './lib/utils/auth';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  const isApiRoute = pathname.startsWith('/api/');
  if (!isApiRoute) {
    return NextResponse.next();
  }

  const isPublicAuthRoute = pathname.startsWith('/api/auth/');
  const isPublicProductsGet = pathname.startsWith('/api/products') && method === 'GET';
  const isPublicCategoriesGet = pathname.startsWith('/api/categories') && method === 'GET';
  const isPublicFishDescGet = pathname.startsWith('/api/fish-descriptions') && method === 'GET';
  const isPublicConfigRoute = pathname === '/api/config';
  const isPublicReviews = pathname.startsWith('/api/reviews/');
  const isPublicCatalog = pathname.startsWith('/api/catalog') && method === 'GET';
  const isPublicBlogs = pathname.startsWith('/api/blogs') && method === 'GET';
  const isPublicCombos = pathname.startsWith('/api/combos') && method === 'GET';
  const isPublicImageKit = pathname.startsWith('/api/imagekit/');
  const isPublicStorage = pathname.startsWith('/api/storage/');
  const isPublicStockAlerts = pathname === '/api/stock-alerts' && method === 'POST';
  const isPublicNotificationsTest = pathname === '/api/notifications/test' && method === 'POST';
  const isPublicNewsletterSubscribe = pathname === '/api/newsletter/subscribe' && method === 'POST';

  if (
    isPublicAuthRoute ||
    isPublicProductsGet ||
    isPublicCategoriesGet ||
    isPublicFishDescGet ||
    isPublicConfigRoute ||
    isPublicReviews ||
    isPublicCatalog ||
    isPublicBlogs ||
    isPublicCombos ||
    isPublicImageKit ||
    isPublicStorage ||
    isPublicStockAlerts ||
    isPublicNotificationsTest ||
    isPublicNewsletterSubscribe
  ) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session expired or invalid token. Please log in again.' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  if (
    (pathname === '/api/products' && method !== 'GET') ||
    (pathname.startsWith('/api/products/') && method !== 'GET')
  ) {
    if (payload.role !== 'vendor' && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (pathname.startsWith('/api/orders/') && method === 'PATCH') {
    if (payload.role !== 'vendor' && payload.role !== 'admin' && payload.role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (pathname === '/api/orders' && method === 'POST' && payload.role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (pathname === '/api/checkout/create-order' && payload.role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (pathname.startsWith('/api/vendors')) {
    if (payload.role !== 'admin' && payload.role !== 'employee') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else if (pathname.startsWith('/api/admin')) {
    const isCartsRoute = pathname === '/api/admin/carts';
    const isOrdersOverview = pathname === '/api/admin' && request.nextUrl.searchParams.get('type') === 'orders';
    const isEmployeeAllowed = isCartsRoute || isOrdersOverview;

    if (payload.role !== 'admin' && !(payload.role === 'employee' && isEmployeeAllowed)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
