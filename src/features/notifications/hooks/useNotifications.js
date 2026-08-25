import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../../../api/services/notifications.api';
import { useUserDetails } from '../../users/hooks/useUsers';

export const useNotifications = () => {
  const { data: userDetails } = useUserDetails();
  const userId = userDetails?.id;
  
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationsApi.getNotifications(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { data: userDetails } = useUserDetails();
  const userId = userDetails?.id;
  
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });
};

export const useClearAllNotifications = () => {
  const queryClient = useQueryClient();
  const { data: userDetails } = useUserDetails();
  const userId = userDetails?.id;
  
  return useMutation({
    mutationFn: () => notificationsApi.clearAllNotifications(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    }
  });
};
