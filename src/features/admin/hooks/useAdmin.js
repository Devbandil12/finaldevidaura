import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import * as adminApi from '../../../api/services/admin.api';

// ----------------------
// QUERIES
// ----------------------

export const useAdminUsers = (page = 1, limit = 20, search = '') => {
  return useQuery({
    queryKey: ['admin', 'users', page, limit, search],
    queryFn: () => adminApi.getAllUsers(page, limit, search),
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminOrders = (page = 1, limit = 20, search = '', filters = {}) => {
  return useQuery({
    queryKey: ['admin', 'orders', page, limit, search, JSON.stringify(filters)],
    queryFn: () => adminApi.getAllOrders(page, limit, search, filters),
    staleTime: 5 * 60 * 1000,
  });
};

export const useOrderSummary = () => {
  return useQuery({
    queryKey: ['admin', 'orders', 'summary'],
    queryFn: adminApi.getOrderSummary,
    staleTime: 5 * 60 * 1000,
  });
};

export const useAdminOrderDetails = (orderId) => {
  return useQuery({
    queryKey: ['admin', 'orders', orderId],
    queryFn: () => adminApi.getSingleOrderDetails(orderId),
    enabled: !!orderId,
  });
};

export const useAdminReports = () => {
  return useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: adminApi.getReportData,
    staleTime: 10 * 60 * 1000,
  });
};

export const useAdminAbandonedCarts = () => {
  return useQuery({
    queryKey: ['admin', 'abandonedCarts'],
    queryFn: adminApi.getAbandonedCarts,
    staleTime: 10 * 60 * 1000,
  });
};

export const useRecoverAbandonedCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.recoverAbandonedCart,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'abandonedCarts'] });
      if (window.toast) window.window.toast.success(data?.message || 'Recovery email sent');
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Failed to send recovery email');
    }
  });
};

export const useAdminWishlistStats = () => {
  return useQuery({
    queryKey: ['admin', 'wishlistStats'],
    queryFn: adminApi.getWishlistStats,
    staleTime: 10 * 60 * 1000,
  });
};

// --- REWARDS HOOKS ---
export const usePendingRewardClaims = () => {
  return useQuery({
    queryKey: ['admin', 'rewards', 'pendingClaims'],
    queryFn: adminApi.getPendingRewardClaims,
    staleTime: 5 * 60 * 1000,
  });
};

export const useRewardsConfig = () => {
  return useQuery({
    queryKey: ['admin', 'rewards', 'config'],
    queryFn: adminApi.getRewardsConfig,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRewardsConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateRewardsConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rewards', 'config'] });
      if (window.toast) window.window.toast.success("Reward amounts updated!");
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Failed to update reward amounts");
    }
  });
};

export const useDecideRewardClaim = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.decideRewardClaim,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'rewards', 'pendingClaims'] });
      if (window.toast) window.window.toast.success(`Claim ${variables.decision}ed successfully`);
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Failed to process claim");
    }
  });
};

export const usePickLotteryWinner = () => {
  return useMutation({
    mutationFn: adminApi.pickLotteryWinner,
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || "Failed to pick winner");
    }
  });
};

// --- REFERRALS HOOKS ---
export const useReferralData = () => {
  return useQuery({
    queryKey: ['admin', 'referrals', 'data'],
    queryFn: adminApi.getReferralData,
    staleTime: 5 * 60 * 1000,
  });
};

export const useReferralsConfig = () => {
  return useQuery({
    queryKey: ['admin', 'referrals', 'config'],
    queryFn: adminApi.getReferralsConfig,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateReferralsConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateReferralsConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'referrals', 'config'] });
      if (window.toast) window.window.toast.success("Referral amounts updated!");
    },
    onError: () => {
      if (window.toast) window.window.toast.error("Failed to update referral amounts");
    }
  });
};

// ----------------------
// MUTATIONS
// ----------------------

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (window.toast) window.window.toast.success('User updated');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to update user');
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (window.toast) window.window.toast.success('User deleted');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to delete user');
    }
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateOrderStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success(`Order #${variables.orderId} updated`);
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to update order');
    }
  });
};

export const useAddOrderNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.addOrderNote,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success(`Note added to Order #${variables.orderId}`);
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to add note');
    }
  });
};

export const useAdminInitiateReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.initiateAdminReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success('Return initiated successfully');
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(`Failed: ${err.message}`);
    }
  });
};

export const useAdminInitiateRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.initiateAdminRefund,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'attention-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
      if (variables?.orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'orders', variables.orderId] });
      }
      if (window.toast) window.toast.success('Refund processed successfully');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || err.message || 'Failed to process refund';
      if (window.toast) window.toast.error(msg);
    }
  });
};

export const useUpdateBulkOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.updateBulkOrderStatus,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success(data.message || 'Bulk update successful');
    },
    onError: () => {
      if (window.toast) window.window.toast.error('Failed to update orders');
    }
  });
};

export const usePreviewShipOrders = () => {
  return useMutation({
    mutationFn: adminApi.previewShipOrders,
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Couldn\'t fetch shipping estimate.');
    }
  });
};

export const useShipOrders = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.shipOrders,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success(data.message || 'Orders shipped.');
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Couldn\'t ship the selected orders.');
    }
  });
};

export const useCancelOrderAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApi.cancelOrder,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      if (window.toast) window.window.toast.success(data.message || `Order #${variables.orderId} cancelled by Admin`);
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Failed to cancel order');
    }
  });
};

export const useAdminLotteryHistory = () => {
  return useQuery({
    queryKey: ['admin', 'lotteryHistory'],
    queryFn: adminApi.getLotteryHistory
  });
};

export const useAdminFunnelStats = () => {
  return useQuery({
    queryKey: ['admin', 'funnelStats'],
    queryFn: adminApi.getFunnelStats
  });
};

export const useAdminTopReturnedProducts = () => {
  return useQuery({
    queryKey: ['admin', 'topReturnedProducts'],
    queryFn: adminApi.getTopReturnedProducts
  });
};

// --- REAL-TIME SSE HOOK ---
export const useAdminOrdersRealtime = (enabled = true) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!enabled) return;

    let eventSource = null;
    let isActive = true;

    const connect = async () => {
      try {
        if (!isActive) return;

        const token = await getToken();
        if (!token) {
          setTimeout(() => {
            if (isActive) connect();
          }, 1500);
          return;
        }
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");
        const sseUrl = `${backendUrl}/api/orders/stream?token=${encodeURIComponent(token)}`;
        
        eventSource = new EventSource(sseUrl, { withCredentials: true });
        
        eventSource.addEventListener('connected', (e) => {
          console.log('📶 [SSE] Connected to Orders real-time stream:', JSON.parse(e.data));
        });
        
        eventSource.addEventListener('order_update', (e) => {
          try {
            const data = JSON.parse(e.data);
            console.log('📡 [SSE] Order real-time update received:', data);
            
            // Invalidate admin orders, summary, stats and attention queries for auto-refresh
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'summary'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard-stats'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'attention-counts'] });
            
            if (data.orderId) {
              queryClient.invalidateQueries({ queryKey: ['admin', 'orders', data.orderId] });
            }
          } catch (parseErr) {
            console.error('⚠️ [SSE] Failed to parse order update:', parseErr);
          }
        });
        
        eventSource.onerror = (err) => {
          console.warn('📶 [SSE] Orders stream disconnected, retrying in 5s...', err);
          if (eventSource) eventSource.close();
          setTimeout(() => {
            if (isActive) connect();
          }, 5000);
        };
      } catch (err) {
        console.error('❌ [SSE] Orders connection failed:', err);
      }
    };
    
    connect();
    
    return () => {
      isActive = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [enabled, queryClient, getToken]);
};
