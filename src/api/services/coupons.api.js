import { httpClient } from '../client/httpClient';

export const getCoupons = async () => {
  const res = await httpClient.get('/api/coupons');
  return res.data;
};

export const getAvailableCoupons = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/coupons/available?userId=${userId}`);
  return res.data;
};

export const getAutoOfferInstructions = async () => {
  const res = await httpClient.get('/api/coupons/automatic-offers');
  return res.data;
};

export const validateCoupon = async (code, userId) => {
  if (!code || !userId) throw new Error("Code and user ID are required");
  const res = await httpClient.get(`/api/coupons/validate?code=${code}&userId=${userId}`);
  return res.data;
};

export const saveCoupon = async (couponData) => {
  const { id, ...data } = couponData;
  if (id) {
    const res = await httpClient.put(`/api/coupons/${id}`, data);
    return res.data;
  } else {
    const res = await httpClient.post('/api/coupons', data);
    return res.data;
  }
};

export const deleteCoupon = async (id) => {
  const res = await httpClient.delete(`/api/coupons/${id}`);
  return res.data;
};
