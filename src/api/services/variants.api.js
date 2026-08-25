import { httpClient } from "../client/httpClient";

export const addVariant = async (variantData) => {
  const res = await httpClient.post("/api/variants", variantData);
  return res.data;
};

export const updateVariant = async ({ variantId, variantData }) => {
  const res = await httpClient.put(`/api/variants/${variantId}`, variantData);
  return res.data;
};

export const archiveVariant = async (variantId) => {
  const res = await httpClient.put(`/api/variants/${variantId}/archive`, {});
  return res.data;
};

export const unarchiveVariant = async (variantId) => {
  const res = await httpClient.put(`/api/variants/${variantId}/unarchive`, {});
  return res.data;
};

export const deleteVariant = async (variantId) => {
  const res = await httpClient.delete(`/api/variants/${variantId}`);  
  return res.data;
};