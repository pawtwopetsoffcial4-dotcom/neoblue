import Notification from '@/lib/models/Notification';

/**
 * Creates and saves a notification to the database for a specific user/vendor.
 */
export async function createNotification(
  userId: string | any,
  title: string,
  message: string,
  type: 'order_status' | 'new_order' | 'claim' | 'general',
  link?: string
) {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
