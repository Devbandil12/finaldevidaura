import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ordersApi from '../../../api/services/orders.api';
import { useUser } from '@clerk/clerk-react';

export const useMyOrders = () => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: () => ordersApi.getMyOrders(user?.id),
    enabled: !!user?.id,
  });
};

export const useSingleOrder = (orderId) => {
  const { user } = useUser();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getSingleOrder(orderId),
    enabled: !!user?.id && !!orderId,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: ({ orderId, amount }) => ordersApi.cancelOrder({ orderId, amount }),
    onSuccess: (data, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      if (window.toast) window.window.toast.success(data.message || `Order ${orderId} cancelled successfully.`);
    },
    onError: (error) => {
      if (window.toast) window.window.toast.error(error.message || "Failed to cancel order.");
    }
  });
};

export const useReturnOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: (orderId) => ordersApi.returnOrder(orderId),
    onSuccess: (data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      if (window.toast) window.window.toast.success(data.message || `Return for order ${orderId} initiated successfully.`);
    },
    onError: (error) => {
      if (window.toast) window.window.toast.error(error.message || "Failed to initiate return.");
    }
  });
};
