import { httpClient } from '../client/httpClient';

export const getWishlist = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/cart/wishlist/${userId}`);
  return res.data;
};

export const addToWishlist = async ({ productId, variantId }) => {
  const res = await httpClient.post('/api/cart/wishlist', { productId, variantId });
  return res.data;
};

export const removeFromWishlist = async ({ userId, variantId }) => {
  const res = await httpClient.delete(`/api/cart/wishlist/${userId}/${variantId}`);
  return res.data;
};

export const clearWishlist = async (userId) => {
  const res = await httpClient.delete(`/api/cart/wishlist/${userId}`);
  return res.data;
};

export const mergeGuestWishlist = async (guestWishlistPayload) => {
  const res = await httpClient.post('/api/cart/wishlist/merge', { guestWishlist: guestWishlistPayload });
  return res.data;
};
