import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export const useSiteStatus = () => {
  return useQuery({
    queryKey: ['siteStatus'],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE}/api/site/status`);
      return data;
    },
    refetchInterval: (query) => {
      const data = query?.state?.data;
      // If currently in maintenance or has scheduled end, poll faster (every 5 seconds)
      if (data?.mode === 'MAINTENANCE' || data?.scheduledEnd) {
        return 5000;
      }
      return 15000;
    },
    staleTime: 3000,
    retry: true,
  });
};
