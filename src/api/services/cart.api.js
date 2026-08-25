import { httpClient } from '../client/httpClient';

// --- CART QUERIES ---
export const getCart = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/cart/${userId}`);
  return res.data;
};

// --- CART MUTATIONS ---
export const addToCart = async ({ productId, variantId, quantity }) => {
  const res = await httpClient.post('/api/cart', { productId, variantId, quantity });
  return res.data;
};

export const updateCartQuantity = async ({ userId, variantId, quantity }) => {
  const res = await httpClient.put(`/api/cart/${userId}/${variantId}`, { quantity });
  return res.data;
};

export const removeFromCart = async ({ userId, variantId }) => {
  const res = await httpClient.delete(`/api/cart/${userId}/${variantId}`);
  return res.data;
};

export const clearCart = async (userId) => {
  const res = await httpClient.delete(`/api/cart/${userId}`);
  return res.data;
};

export const mergeGuestCart = async (guestCartPayload) => {
  const res = await httpClient.post('/api/cart/merge', { guestCart: guestCartPayload });
  return res.data;
};

export const addCustomBundle = async ({ templateVariantId, contentVariantIds }) => {
  const res = await httpClient.post('/api/cart/add-custom-bundle', { templateVariantId, contentVariantIds });
  return res.data;
};

// --- SAVED FOR LATER ---
export const getSavedItems = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/cart/saved-for-later/${userId}`);
  return res.data;
};

export const saveForLater = async ({ variantId, quantity }) => {
  const res = await httpClient.post('/api/cart/save-for-later', { variantId, quantity });
  return res.data;
};

export const moveSavedToCart = async ({ variantId, quantity }) => {
  const res = await httpClient.post('/api/cart/move-to-cart', { variantId, quantity });
  return res.data;
};

export const removeSavedItem = async ({ userId, variantId }) => {
  const res = await httpClient.delete(`/api/cart/saved-for-later/${userId}/${variantId}`);
  return res.data;
};

// --- PREVIEW ---
export const getPricePreview = async (requestBody) => {
  const res = await httpClient.post('/api/cart/price-preview', requestBody);
  return res.data;
};

