import { httpClient } from '../client/httpClient';

export const getNotifications = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/notifications/user/${userId}`);
  return res.data.notifications || [];
};

export const markAllAsRead = async (userId) => {
  const res = await httpClient.put(`/api/notifications/mark-read/user/${userId}`);
  return res.data;
};

export const clearAllNotifications = async (userId) => {
  const res = await httpClient.delete(`/api/notifications/user/${userId}`);
  return res.data;
};
