import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productsApi from '../../../api/services/products.api';
import * as variantsApi from '../../../api/services/variants.api';

// ----------------------
// QUERIES
// ----------------------

export const useProducts = () => {
  return useQuery({
    queryKey: ['products', 'active'],
    queryFn: productsApi.getProducts,
  });
};

export const useArchivedProducts = () => {
  return useQuery({
    queryKey: ['products', 'archived'],
    queryFn: productsApi.getArchivedProducts,
  });
};

// ----------------------
// PRODUCT MUTATIONS
// ----------------------

export const useAddProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useArchiveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.archiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUnarchiveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.unarchiveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useRefreshProductStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.refreshProductStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ----------------------
// VARIANT MUTATIONS
// ----------------------

export const useAddVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variantsApi.addVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variantsApi.updateVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateBulkVariants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productsApi.updateBulkVariants,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useArchiveVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variantsApi.archiveVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUnarchiveVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variantsApi.unarchiveVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

// ----------------------
// AURA FINDER MUTATION
// ----------------------
export const useAuraMatch = () => {
  return useMutation({
    mutationFn: ({ occasion, vibe }) => productsApi.getAuraMatch(occasion, vibe),
  });
};
export const useDeleteVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: variantsApi.deleteVariant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
};