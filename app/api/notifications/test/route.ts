import { NextResponse } from 'next/server';
import { getSecret } from '@/lib/utils/secrets';

export async function POST() {
  const appId = await getSecret('ONESIGNAL_APP_ID');
  const restApiKey = await getSecret('ONESIGNAL_REST_API_KEY');

  if (!appId || !restApiKey) {
    return NextResponse.json({ error: 'OneSignal is not configured' }, { status: 500 });
  }

  try {
    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ['Total Subscriptions'],
        target_channel: 'push',
        headings: { en: 'NeoBlue Test Notification' },
        contents: { en: 'This is a test push notification from clicking the logo — it works!' },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.neoblue.in',
      }),
    });

    const data = await res.json();
    // OneSignal can return HTTP 200 with an `errors` array for logical failures
    // (e.g. an empty/misnamed segment) — treat that the same as a hard failure.
    if (!res.ok || (Array.isArray(data?.errors) && data.errors.length > 0)) {
      return NextResponse.json({ error: data }, { status: res.ok ? 422 : res.status });
    }

    return NextResponse.json({ success: true, recipients: data.recipients ?? 0, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
