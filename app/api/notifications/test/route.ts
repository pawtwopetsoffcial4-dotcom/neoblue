import { NextResponse } from 'next/server';

export async function POST() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

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
        included_segments: ['Subscribed Users'],
        target_channel: 'push',
        headings: { en: 'NeoBlue Test Notification' },
        contents: { en: 'This is a test push notification from clicking the logo — it works!' },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.neoblue.in',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, recipients: data.recipients ?? 0, id: data.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test notification' },
      { status: 500 }
    );
  }
}
