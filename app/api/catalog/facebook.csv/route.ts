import { GET as facebookFeedHandler } from '../facebook/route';

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set('format', 'csv');
  const csvRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
  });
  return facebookFeedHandler(csvRequest);
}
