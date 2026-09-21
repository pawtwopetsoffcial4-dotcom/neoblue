import mongoose from 'mongoose';
import Notification from '@/lib/models/Notification';

async function sendPushNotification(userId: string, title: string, message: string, link?: string, imageUrl?: string) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !restApiKey) return;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://neoblue.in';

    const payload: Record<string, unknown> = {
      app_id: appId,
      include_aliases: { external_id: [userId] },
      target_channel: 'push',
      headings: { en: title },
      contents: { en: message },
      url: link ? `${siteUrl.replace(/\/$/, '')}${link}` : siteUrl,
    };

    if (imageUrl) {
      payload.big_picture = imageUrl;
      payload.chrome_web_image = imageUrl;
    }

    const res = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('OneSignal push failed:', await res.text());
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Creates and saves a notification to the database for a specific user/vendor,
 * and also sends a real push notification via OneSignal (if configured).
 */
export async function createNotification(
  userId: string | mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: 'order_status' | 'new_order' | 'claim' | 'general',
  link?: string,
  imageUrl?: string
) {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });

    sendPushNotification(userId.toString(), title, message, link, imageUrl);

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
