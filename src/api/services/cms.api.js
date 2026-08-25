import { httpClient } from '../client/httpClient';

export const getBanners = async () => {
  const res = await httpClient.get(`/api/cms/banners`);
  return res.data;
};

export const createBanner = async (bannerData) => {
  const res = await httpClient.post(`/api/cms/banners`, bannerData);
  return res.data;
};

export const deleteBanner = async (id) => {
  const res = await httpClient.delete(`/api/cms/banners/${id}`);
  return res.data;
};

export const toggleBannerActive = async ({ id, isActive }) => {
  const res = await httpClient.put(`/api/cms/banners/${id}`, { isActive });
  return res.data;
};

export const getAboutUs = async () => {
  const res = await httpClient.get(`/api/cms/about`);
  return res.data;
};

export const updateAboutUs = async (data) => {
  const res = await httpClient.post('/api/cms/about', data);
  return res.data;
};
