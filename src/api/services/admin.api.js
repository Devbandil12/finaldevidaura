import { httpClient } from '../client/httpClient';

// Users
export const getAllUsers = async (page = 1, limit = 20, search = '') => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  const res = await httpClient.get(`/api/users?${params.toString()}`);
  return res.data;
};

export const updateUser = async ({ userId, updates }) => {
  const res = await httpClient.put(`/api/users/${userId}`, updates);
  return res.data;
};

export const deleteUser = async (userId) => {
  const res = await httpClient.delete(`/api/users/${userId}`);
  return res.data;
};

// Orders
export const getAllOrders = async (page = 1, limit = 20, search = '', filters = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (search) params.append('search', search);
  
  if (filters.status && filters.status !== 'All') params.append('status', filters.status);
  if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
  if (filters.fulfillmentStatus) params.append('fulfillmentStatus', filters.fulfillmentStatus);
  if (filters.returnStatus) params.append('returnStatus', filters.returnStatus);
  if (filters.refundStatus) params.append('refundStatus', filters.refundStatus);

  const res = await httpClient.get(`/api/orders?${params.toString()}`);
  return res.data;
};

export const getOrderSummary = async () => {
  const res = await httpClient.get('/api/orders/admin/summary');
  return res.data;
};

export const getDashboardStats = async (timeRange, startDate, endDate) => {
  let url = `/api/orders/admin/dashboard-stats?timeRange=${timeRange}`;
  if (timeRange === 'custom' && startDate && endDate) {
    url += `&startDate=${startDate}&endDate=${endDate}`;
  }
  const res = await httpClient.get(url);
  return res.data;
};

export const getAttentionCounts = async () => {
  const res = await httpClient.get('/api/orders/admin/attention-counts');
  return res.data;
};

export const getSingleOrderDetails = async (orderId) => {
  const res = await httpClient.get(`/api/orders/${orderId}`);
  return res.data;
};

const generateIdempotencyKey = () => `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

export const addOrderNote = async ({ orderId, note }) => {
  const res = await httpClient.post(`/api/orders/${orderId}/notes`, { note }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const initiateAdminReturn = async ({ orderId, payload }) => {
  const res = await httpClient.post(`/api/orders/${orderId}/admin-returns`, payload, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const initiateAdminRefund = async ({ orderId, payload }) => {
  const res = await httpClient.post(`/api/orders/${orderId}/admin-refunds`, payload, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const updateOrderStatus = async ({ orderId, status, courierData, version }) => {
  const res = await httpClient.put(`/api/orders/${orderId}/status`, { status, version, ...courierData }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const updateBulkOrderStatus = async ({ orderIds, status }) => {
  const res = await httpClient.put(`/api/orders/bulk-status`, { orderIds, status }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const previewShipOrders = async ({ orderIds }) => {
  const res = await httpClient.post(`/api/orders/admin/ship-preview`, { orderIds });
  return res.data;
};

export const shipOrders = async ({ shipRequests }) => {
  const res = await httpClient.post(`/api/orders/admin/ship-now`, { orders: shipRequests }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

export const cancelOrder = async ({ orderId, amount, version }) => {
  const res = await httpClient.put(`/api/orders/${orderId}/cancel`, { amount, version }, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return res.data;
};

// Analytics & Reports
export const getReportData = async () => {
  const res = await httpClient.get(`/api/orders/details/for-reports`);
  return res.data;
};

export const getAbandonedCarts = async () => {
  const res = await httpClient.get(`/api/cart/admin/abandoned`);
  return res.data;
};

// Rewards & Referrals (Admin)
export const getPendingRewardClaims = async () => {
  const res = await httpClient.get(`/api/rewards/admin/pending`);
  return res.data;
};

export const getRewardsConfig = async () => {
  const res = await httpClient.get(`/api/rewards/config`);
  return res.data;
};

export const updateRewardsConfig = async (config) => {
  const res = await httpClient.post(`/api/rewards/config`, config);
  return res.data;
};

export const decideRewardClaim = async ({ claimId, decision }) => {
  const res = await httpClient.post(`/api/rewards/admin/decide`, { claimId, decision });
  return res.data;
};

export const pickLotteryWinner = async () => {
  const res = await httpClient.post(`/api/rewards/admin/pick-lottery-winner`);
  return res.data;
};

// Referrals (Admin)
export const getReferralData = async () => {
  const res = await httpClient.get(`/api/referrals/admin/all`);
  return res.data;
};

export const getReferralsConfig = async () => {
  const res = await httpClient.get(`/api/referrals/config`);
  return res.data;
};

export const updateReferralsConfig = async (config) => {
  const res = await httpClient.post(`/api/referrals/config`, config);
  return res.data;
};

export const recoverAbandonedCart = async ({ userIds }) => {
  const res = await httpClient.post(`/api/notifications/recover-abandoned`, { userIds });
  return res.data;
};

export const getWishlistStats = async () => {
  const res = await httpClient.get(`/api/cart/admin/wishlist-stats`);
  return res.data;
};



export const getLotteryHistory = async () => {
  const res = await httpClient.get(`/api/rewards/admin/lottery-history`);
  return res.data;
};

export const getFunnelStats = async () => {
  const res = await httpClient.get(`/api/analytics/admin/funnel-stats`);
  return res.data;
};

export const getTopReturnedProducts = async () => {
  const res = await httpClient.get(`/api/analytics/admin/top-returned`);
  return res.data;
};
