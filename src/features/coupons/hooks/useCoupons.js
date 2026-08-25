import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as couponsApi from '../../../api/services/coupons.api';
import { useUser } from '@clerk/clerk-react';
import { useUserDetails } from '../../users/hooks/useUsers';

export const useAllCoupons = () => {
  const { user } = useUser();
  // Typically only admins should call this
  return useQuery({
    queryKey: ['coupons', 'all'],
    queryFn: couponsApi.getCoupons,
    enabled: !!user?.id,
  });
};

export const useAvailableCoupons = () => {
  const { user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;
  
  return useQuery({
    queryKey: ['coupons', 'available', user?.id],
    queryFn: () => couponsApi.getAvailableCoupons(dbUserId),
    enabled: !!dbUserId,
  });
};

export const useAutoOfferInstructions = () => {
  return useQuery({
    queryKey: ['coupons', 'auto-offers'],
    queryFn: couponsApi.getAutoOfferInstructions,
  });
};

export const useValidateCoupon = () => {
  const { user } = useUser();
  const { data: userDetails } = useUserDetails();
  const dbUserId = userDetails?.id;
  
  return useMutation({
    mutationFn: (code) => couponsApi.validateCoupon(code, dbUserId),
    onError: (error) => {
      if (window.toast) window.window.toast.error(error.message || "Invalid coupon code");
    }
  });
};

export const useSaveCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: couponsApi.saveCoupon,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      if (window.toast) window.window.toast.success(variables.id ? "Coupon updated" : "Coupon added");
    },
    onError: (error) => {
      if (window.toast) window.window.toast.error(error.message || "Save failed");
    }
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: couponsApi.deleteCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      if (window.toast) window.window.toast.success("Coupon deleted");
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Delete failed");
    }
  });
};
