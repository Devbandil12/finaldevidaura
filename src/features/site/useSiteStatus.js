import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export const useSiteStatus = () => {
  return useQuery({
    queryKey: ['siteStatus'],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE}/api/site/status`);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds to catch schedule changes
    staleTime: 10000,
    retry: true,
  });
};
