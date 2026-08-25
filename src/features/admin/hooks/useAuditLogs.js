import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { httpClient } from '../../../api/client/httpClient';

export const getAuditLogs = async ({ pageParam = null, filters = {} }) => {
  const params = new URLSearchParams();
  
  if (pageParam) params.append('cursor', pageParam);
  params.append('limit', '50');

  // Append filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'ALL') {
      params.append(key, value);
    }
  });

  const res = await httpClient.get(`/api/admin/audit-logs?${params.toString()}`);
  return res.data;
};

export const useAuditLogs = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: ['admin', 'auditLogs', filters],
    queryFn: ({ pageParam }) => getAuditLogs({ pageParam, filters }),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.nextCursor;
      }
      return undefined;
    },
    staleTime: 60 * 1000, // 1 minute
  });
};
