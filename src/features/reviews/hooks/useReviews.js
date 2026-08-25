import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reviewsApi from '../../../api/services/reviews.api';

export const useUserReviews = (userId) => {
  return useQuery({
    queryKey: ['reviews', 'user', userId],
    queryFn: () => reviewsApi.getUserReviews(userId),
    enabled: !!userId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.createReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      if (window.toast) window.window.toast.success('Review submitted successfully');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to submit review');
    }
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      if (window.toast) window.window.toast.success('Review deleted');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to delete review');
    }
  });
};
