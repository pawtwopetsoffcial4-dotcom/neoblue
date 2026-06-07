import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromRequest } from './lib/utils/auth';

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  const isApiRoute = pathname.startsWith('/api/');
  if (!isApiRoute) {
    return NextResponse.next();
  }

  const isPublicAuthRoute =
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/signup' ||
    pathname === '/api/auth/vendor/login' ||
    pathname === '/api/auth/vendor/signup';
  const isPublicProductsGet = pathname.startsWith('/api/products') && method === 'GET';
  const isPublicCategoriesGet = pathname.startsWith('/api/categories') && method === 'GET';
  const isPublicFishDescGet = pathname.startsWith('/api/fish-descriptions') && method === 'GET';
  const isPublicConfigRoute = pathname === '/api/config';
  const isPublicReviews = pathname.startsWith('/api/reviews/');
  if (isPublicAuthRoute || isPublicProductsGet || isPublicCategoriesGet || isPublicFishDescGet || isPublicConfigRoute || isPublicReviews) {
    return NextResponse.next();
  }

  const token = getTokenFromRequest(request);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  if (
    (pathname === '/api/products' && method !== 'GET') ||
    (pathname.startsWith('/api/products/') && method !== 'GET') ||
    (pathname.startsWith('/api/orders/') && method === 'PATCH')
  ) {
    if (payload.role !== 'vendor' && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (pathname === '/api/orders' && method === 'POST' && payload.role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (pathname === '/api/checkout/create-order' && payload.role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if ((pathname.startsWith('/api/admin') || pathname.startsWith('/api/vendors')) && payload.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
