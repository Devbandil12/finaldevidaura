import { httpClient } from '../client/httpClient';

export const getUserReviews = async (userId) => {
  if (!userId) return [];
  const res = await httpClient.get(`/api/reviews/user/${userId}`);
  return res.data;
};

export const createReview = async (reviewData) => {
  const res = await httpClient.post(`/api/reviews`, reviewData);
  return res.data;
};

export const deleteReview = async (id) => {
  const res = await httpClient.delete(`/api/reviews/${id}`);
  return res.data;
};
