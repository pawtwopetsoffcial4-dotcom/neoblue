import { NextRequest, NextResponse } from 'next/server';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please provide a valid email address' }, { status: 400 });
    }

    const apiToken = process.env.SENDER_API_TOKEN;
    const fromEmail = process.env.SENDER_FROM_EMAIL;
    const groupId = process.env.SENDER_GROUP_ID;

    if (!apiToken || !fromEmail) {
      return NextResponse.json({ error: 'Newsletter service is not configured' }, { status: 500 });
    }

    // Add/update the subscriber in Sender.net. Best-effort — a failure here
    // shouldn't block the confirmation email from going out.
    try {
      await fetch('https://api.sender.net/v2/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          email: normalizedEmail,
          groups: groupId ? [groupId] : undefined,
          trigger_automation: false,
        }),
      });
    } catch (err) {
      console.error('Sender.net add subscriber failed:', err);
    }

    const sendRes = await fetch('https://api.sender.net/v2/message/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: 'NeoBlue' },
        to: { email: normalizedEmail },
        subject: "You're now subscribed to NeoBlue!",
        html: `
          <p>Hi there,</p>
          <p>You're now subscribed to NeoBlue updates — tips, new arrivals, and offers straight to your inbox.</p>
          <p>Thanks for joining us!</p>
          <p>— Team NeoBlue</p>
        `,
      }),
    });

    if (!sendRes.ok) {
      const errData = await sendRes.json().catch(() => ({}));
      console.error('Sender.net send email failed:', errData);
      return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Subscribed! Check your inbox.' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
