import { httpClient } from '../client/httpClient';

export const getMyOrders = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.post('/api/orders/get-my-orders', { userId });
  return res.data;
};

export const getSingleOrder = async (orderId) => {
  const res = await httpClient.get(`/api/orders/${orderId}`);
  return res.data;
};

export const getAllOrders = async () => {
  const res = await httpClient.get('/api/orders/');
  return res.data;
};

export const updateOrderStatus = async ({ orderId, status, additionalData = {} }) => {
  const res = await httpClient.put(`/api/orders/${orderId}/status`, { status, ...additionalData });
  return res.data;
};

export const returnOrder = async (orderId) => {
  const res = await httpClient.post(`/api/orders/${orderId}/return`);
  return res.data;
};

export const cancelOrder = async ({ orderId, amount }) => {
  const res = await httpClient.post('/api/payments/refund', { orderId, amount });
  return res.data;
};
