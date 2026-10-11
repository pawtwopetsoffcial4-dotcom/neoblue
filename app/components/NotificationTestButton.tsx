'use client';

import { useState } from 'react';
import { Bell, Loader2, Check } from 'lucide-react';

export default function NotificationTestButton() {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleClick = async () => {
    if (isSending) return;
    try {
      setIsSending(true);
      setSent(false);
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      if (res.ok) setSent(true);
    } catch {
      // ignore — best-effort test trigger
    } finally {
      setIsSending(false);
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSending}
      title="Send test notification"
      className="fixed bottom-20 md:bottom-5 left-4 z-[1000] h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center transition-all disabled:opacity-60 cursor-pointer"
    >
      {isSending ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : sent ? (
        <Check className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
    </button>
  );
}
