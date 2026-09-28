'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

let hasInitialized = false;

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId || hasInitialized) return;
    hasInitialized = true;

    OneSignal.init({
      appId,
      safariWebId: 'web.onesignal.auto.4924b4f0-134c-425c-876d-dc71d8371c02',
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      notifyButton: {
        enable: true,
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Subscribe to notifications',
          'tip.state.subscribed': "You're subscribed to notifications",
          'tip.state.blocked': "You've blocked notifications",
          'message.prenotify': 'Click to subscribe to notifications',
          'message.action.subscribed': "Thanks for subscribing!",
          'message.action.resubscribed': "You're subscribed to notifications",
          'message.action.unsubscribed': "You won't receive notifications again",
          'message.action.subscribing': 'Subscribing...',
          'dialog.main.title': 'Manage Notifications',
          'dialog.main.button.subscribe': 'Subscribe',
          'dialog.main.button.unsubscribe': 'Unsubscribe',
          'dialog.blocked.title': 'Unblock Notifications',
          'dialog.blocked.message': 'Follow these instructions to allow notifications:',
        },
      },
    })
      .then(() => {
        // Best-effort welcome push for anyone who already granted permission on a past visit.
        fetch('/api/notifications/test', { method: 'POST' }).catch(() => {});
      })
      .catch((error) => {
        console.error('OneSignal init failed:', error);
      });
  }, []);

  return null;
}
