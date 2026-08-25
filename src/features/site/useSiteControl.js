import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/$/, "");

export const useAdminSiteStatus = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      const { data } = await axios.post(`${BASE}/api/site/admin/status`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['siteStatus']);
    }
  });

  return { updateStatus };
};

export const useCreateAnnouncement = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      const { data } = await axios.post(`${BASE}/api/site/admin/announcements`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
    }
  });
};
