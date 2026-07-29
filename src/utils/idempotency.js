// src/utils/idempotency.js
//
// Shared helper for generating a fresh client-side idempotency key
// for each individual order-creation attempt (COD, Wallet, or Razorpay).
//
// IMPORTANT: call this fresh, right before every call to
// /api/payments/createOrder — do NOT generate once and reuse across
// multiple attempts/retries. The backend only releases its Redis lock
// on that key when the request errors out; if the request succeeds
// (e.g. a Razorpay order was created but the user then cancels the
// payment popup), the same key would stay locked for 24h and block
// a legitimate retry.

export function generateIdempotencyKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
