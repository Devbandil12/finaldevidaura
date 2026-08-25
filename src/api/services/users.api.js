import { httpClient } from '../client/httpClient';

export const getUserAddresses = async (userId) => {
  const res = await httpClient.get(`/api/address/user/${userId}`);
  return res.data;
};

export const getMe = async () => {
  const res = await httpClient.get(`/api/users/me`);
  return res.data;
};

export const syncUser = async (userData) => {
  const res = await httpClient.post(`/api/users`, userData);
  return res.data;
};

export const addAddress = async (addressData) => {
  const res = await httpClient.post(`/api/address/`, addressData);
  return res.data;
};

export const updateAddress = async ({ addressId, updatedFields }) => {
  const res = await httpClient.put(`/api/address/${addressId}`, updatedFields);
  return res.data;
};

export const deleteAddress = async (addressId) => {
  const res = await httpClient.delete(`/api/address/${addressId}`);
  return res.data;
};

export const setDefaultAddress = async ({ addressId }) => {
  const res = await httpClient.put(`/api/address/${addressId}/default`);
  return res.data;
};

export const updateUser = async ({ userId, updatedData }) => {
  const res = await httpClient.put(`/api/users/${userId}`, updatedData);
  return res.data;
};
