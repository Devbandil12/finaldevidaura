import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as contactApi from '../../../api/services/contact.api';
import { useUser } from '@clerk/clerk-react';

export const useAdminTickets = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['tickets', 'admin'],
    queryFn: contactApi.getAllTickets,
    enabled: !!user?.id,
  });
};

export const useUserTickets = (email) => {
  return useQuery({
    queryKey: ['tickets', 'user', email],
    queryFn: () => contactApi.getUserTickets(email),
    enabled: !!email,
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.createTicket,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (window.toast) window.window.toast.success('Ticket created successfully');
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Failed to create ticket');
    }
  });
};

export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.replyToTicket,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (window.toast) window.window.toast.success('Reply sent');
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Failed to reply');
    }
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: contactApi.updateTicketStatus,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      if (window.toast) window.window.toast.success(`Ticket marked as ${variables.status}`);
    },
    onError: (err) => {
      if (window.toast) window.window.toast.error(err.response?.data?.error || 'Failed to update ticket status');
    }
  });
};
