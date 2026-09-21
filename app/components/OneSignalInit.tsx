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
    }).catch((error) => {
      console.error('OneSignal init failed:', error);
    });
  }, []);

  return null;
}
