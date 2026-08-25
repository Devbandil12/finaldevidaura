import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as cmsApi from '../../../api/services/cms.api';

export const useBanners = () => {
  return useQuery({
    queryKey: ['cms', 'banners'],
    queryFn: cmsApi.getBanners,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cmsApi.createBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'banners'] });
      if (window.toast) window.window.toast.success('Banner published successfully!');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to publish banner');
    }
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cmsApi.deleteBanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'banners'] });
      if (window.toast) window.window.toast.success('Banner deleted.');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to delete banner');
    }
  });
};

export const useToggleBanner = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cmsApi.toggleBannerActive,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'banners'] });
      if (window.toast) window.window.toast.success(variables.isActive ? "Banner hidden" : "Banner active");
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to toggle banner');
    }
  });
};

export const useAboutUs = () => {
  return useQuery({
    queryKey: ['cms', 'about'],
    queryFn: cmsApi.getAboutUs,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

export const useUpdateAboutUs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cmsApi.updateAboutUs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'about'] });
      if (window.toast) window.window.toast.success('About Us content updated successfully');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to update About Us content');
    }
  });
};
