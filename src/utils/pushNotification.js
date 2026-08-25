const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

const PUSH_COOLDOWN_KEY = 'devidaura_push_cooldown_until';
const COOLDOWN_DAYS = 7;

function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("VAPID Public Key is missing! Check your VITE_VAPID_PUBLIC_KEY variable.");
  }
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser allows push and is not denied / on cooldown
 */
export function isPushPromptAllowed() {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'denied' || Notification.permission === 'granted') return false;

  const cooldownUntil = localStorage.getItem(PUSH_COOLDOWN_KEY);
  if (cooldownUntil && Date.now() < parseInt(cooldownUntil, 10)) {
    return false;
  }
  return true;
}

/**
 * Dismiss prompt with a 7-day cooldown
 */
export function dismissPushPrompt() {
  const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(PUSH_COOLDOWN_KEY, String(Date.now() + cooldownMs));
}

/**
 * Sync or register push subscription based on permission state:
 * - 'denied': silently do nothing
 * - 'granted': silently sync/repair subscription to backend
 * - 'default': do not prompt automatically on page load unless user triggers it
 */
export async function syncPushSubscription(userId, token, { promptIfDefault = false } = {}) {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (!PUBLIC_KEY || !token) return;

  const permission = Notification.permission;

  // 1. If denied -> silently do nothing
  if (permission === 'denied') {
    return;
  }

  // 2. If default and prompt is not explicitly requested -> do nothing
  if (permission === 'default' && !promptIfDefault) {
    return;
  }

  try {
    const register = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await register.pushManager.getSubscription();

    // If permission is default and user requested prompt, or if granted but subscription missing:
    if (!subscription) {
      subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      });
    }

    if (subscription) {
      await fetch(`${BACKEND_URL}/api/notifications/subscribe`, {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    // Silent fail for background sync errors
    console.debug('[WebPush] Background sync ignored:', error.message);
  }
}

// Backward-compatible alias
export const subscribeToPush = (userId, token) => syncPushSubscription(userId, token, { promptIfDefault: false });