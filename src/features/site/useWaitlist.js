import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, "");

export const useWaitlist = ({ search = '', sort = 'desc', page = 1, limit = 20 } = {}) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['waitlist', search, sort, page, limit],
    queryFn: async () => {
      const token = await getToken();
      const { data } = await axios.get(`${BASE}/api/site/admin/waitlist`, {
        params: { search, sort, page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });
      return data;
    },
    keepPreviousData: true,
  });
};

export const exportWaitlistCSV = async (getToken) => {
  const token = await getToken();
  const response = await axios.get(`${BASE}/api/site/admin/waitlist/export`, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `devidaura-launch-waitlist-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  if (link.parentNode) {
    link.parentNode.removeChild(link);
  }
};
