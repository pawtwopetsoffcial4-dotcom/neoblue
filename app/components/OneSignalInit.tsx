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
      serviceWorkerPath: 'OneSignalSDKWorker.js',
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
