import { httpClient } from "../client/httpClient";

export const getProducts = async () => {
  const res = await httpClient.get("/api/products");
  return res.data;
};

export const getArchivedProducts = async () => {
  const res = await httpClient.get("/api/products/archived");
  return res.data;
};

export const addProduct = async (newProduct) => {
  const res = await httpClient.post("/api/products", newProduct);
  return res.data;
};

export const updateProduct = async ({ productId, updatedData }) => {
  const res = await httpClient.put(`/api/products/${productId}`, updatedData);
  return res.data;
};

export const archiveProduct = async (productId) => {
  const res = await httpClient.put(`/api/products/${productId}/archive`, {});
  return res.data;
};

export const unarchiveProduct = async (productId) => {
  const res = await httpClient.put(`/api/products/${productId}/unarchive`, {});
  return res.data;
};

export const refreshProductStock = async () => {
  const res = await httpClient.post("/api/products/cache/invalidate");
  return res.data;
};

// Sometimes bulk update for variants was attached here in the context
export const updateBulkVariants = async (updates) => {
  const res = await httpClient.put("/api/products/variants/bulk", { updates });
  return res.data;
};

export const getAuraMatch = async (occasion, vibe) => {
  const res = await httpClient.post("/api/products/aura-match", { occasion, vibe });
  return res.data;
};

