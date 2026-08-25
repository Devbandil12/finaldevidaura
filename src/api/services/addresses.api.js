import { httpClient } from '../client/httpClient.js';

export const getAddresses = async () => (await httpClient.get(`/addresses`)).data;
export const createAddress = async (data) => (await httpClient.post(`/addresses`, data)).data;
export const updateAddress = async (data) => { const { id, ...rest } = data; return (await httpClient.patch(`/addresses/${id}`, rest)).data; };
export const deleteAddress = async (id) => (await httpClient.delete(`/addresses/${id}`)).data;
