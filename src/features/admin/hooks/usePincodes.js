import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as pincodeApi from '../../../api/services/pincode.api';

export const useAllPincodes = () => {
  return useQuery({
    queryKey: ['admin', 'pincodes', 'all'],
    queryFn: pincodeApi.getAllPincodes,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCityPincodes = (state, city) => {
  return useQuery({
    queryKey: ['admin', 'pincodes', 'city', state, city],
    queryFn: () => pincodeApi.getCityPincodes({ state, city }),
    enabled: !!state && !!city,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateSinglePincode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.updateSinglePincode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success("Pincode updated successfully");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to update pincode");
    }
  });
};

export const useBatchCreatePincodes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.batchCreatePincodes,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success(data?.message || "Pincodes uploaded successfully");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to upload pincodes");
    }
  });
};

export const useBulkUpdatePincodes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.bulkUpdatePincodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success("Bulk update successful");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to perform bulk update");
    }
  });
};

export const useBulkDeletePincodes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.bulkDeletePincodes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success("Pincodes deleted successfully");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to delete pincodes");
    }
  });
};

export const useUpdateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.updateRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success("Region updated successfully");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to update region");
    }
  });
};

export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: pincodeApi.deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pincodes'] });
      if (window.toast) window.window.toast.success("Region deleted successfully");
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.message || "Failed to delete region");
    }
  });
};
