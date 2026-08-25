import { httpClient } from '../client/httpClient.js';

export const getAllPincodes = async () => {
  const res = await httpClient.get(`/api/address/pincodes`);
  return res.data;
};

export const getCityPincodes = async ({ state, city }) => {
  const res = await httpClient.get(`/api/address/pincodes/${encodeURIComponent(state)}/${encodeURIComponent(city)}`);
  return res.data;
};

export const updateSinglePincode = async ({ pincode, data }) => {
  const res = await httpClient.put(`/api/address/pincodes/${pincode}`, data);
  return res.data;
};

export const batchCreatePincodes = async (data) => {
  const res = await httpClient.post(`/api/address/pincodes/batch`, data);
  return res.data;
};

export const bulkUpdatePincodes = async ({ pincodes, data }) => {
  const res = await httpClient.put(`/api/address/pincodes/bulk-update`, { pincodes, data });
  return res.data;
};

export const bulkDeletePincodes = async (pincodes) => {
  const res = await httpClient.post(`/api/address/pincodes/bulk-delete`, { pincodes });
  return res.data;
};

export const updateRegion = async ({ state, city, data }) => {
  const res = await httpClient.put(`/api/address/pincodes/region/update`, { state, city, data });
  return res.data;
};

export const deleteRegion = async ({ state, city }) => {
  const res = await httpClient.post(`/api/address/pincodes/region/delete`, { state, city });
  return res.data;
};
