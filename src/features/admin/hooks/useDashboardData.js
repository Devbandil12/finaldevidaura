import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../../../api/services/admin.api';

export const useDashboardData = (timeRange, startDate, endDate) => {
  const { data: dashboardData, isLoading, isFetching: isDashboardFetching, refetch: refetchDashboard } = useQuery({
    queryKey: ['admin', 'dashboardStats', timeRange, startDate, endDate],
    queryFn: () => adminApi.getDashboardStats(timeRange, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: attentionData, isLoading: isAttentionLoading, isFetching: isAttentionFetching, refetch: refetchAttention } = useQuery({
    queryKey: ['admin', 'attentionCounts'],
    queryFn: adminApi.getAttentionCounts,
    staleTime: 2 * 60 * 1000,   // 2 min — more frequent than dashboard stats
    refetchOnWindowFocus: true,  // refresh on focus — always fresh operational counts
  });

  const refreshAll = () => {
    refetchDashboard();
    refetchAttention();
  };

  const isFetching = isDashboardFetching || isAttentionFetching;

  return { dashboardData, attentionData, isLoading, isAttentionLoading, refreshAll, isFetching };
};
