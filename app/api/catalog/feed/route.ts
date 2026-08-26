import { GET as facebookFeedHandler } from '../facebook/route';

export async function GET(request: Request) {
  return facebookFeedHandler(request);
}
