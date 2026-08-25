import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export const useAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE}/api/site/announcements`);
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    retry: true,
  });
};
