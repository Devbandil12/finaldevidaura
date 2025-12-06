const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
// Clean the URL to avoid double slashes
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, ""); 

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

export async function subscribeToPush(userId) {
  if (!('serviceWorker' in navigator)) return;
  if (!PUBLIC_KEY) {
      console.error("❌ Push Aborted: VITE_VAPID_PUBLIC_KEY is missing.");
      return;
  }

  try {
    const register = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // Browser asks for permission here
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
    });

    // Send to Backend
    const res = await fetch(`${BACKEND_URL}/api/notifications/subscribe?userId=${userId}`, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: { 'Content-Type': 'application/json' }
    });

    // 🟢 CRITICAL FIX: Check if server actually accepted it
    if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
    }

    console.log("✅ Push Notification Subscribed Successfully!");
  } catch (error) {
    console.error("❌ Push Subscription Failed:", error.message);
  }
}