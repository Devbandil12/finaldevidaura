import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as supportApi from '../../../api/services/support.api';
import { useUser, useAuth } from '@clerk/clerk-react';

// ── Customer Hooks ────────────────────────────────────────────────────────────

export const useMyTickets = (page = 1) => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'my-tickets', page],
    queryFn: () => supportApi.getMyTickets({ page }),
    enabled: !!user?.id,
  });
};

export const useMyTicketById = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'my-ticket', ticketId],
    queryFn: () => supportApi.getMyTicketById(ticketId),
    enabled: !!ticketId,
  });
};

export const useMyTicketMessages = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'my-messages', ticketId],
    queryFn: () => supportApi.getMyTicketMessages(ticketId),
    enabled: !!ticketId,
    refetchInterval: 15000, // Poll every 15s for new messages
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => supportApi.createTicket(variables, crypto.randomUUID()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] });
      if (window.toast) window.toast.success('Support ticket created successfully');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to create ticket');
    },
  });
};

export const useCreateGuestTicket = () => {
  return useMutation({
    mutationFn: (variables) => supportApi.createGuestTicket(variables, crypto.randomUUID()),
    onSuccess: () => {
      if (window.toast) window.toast.success('Support ticket created successfully');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to create ticket');
    },
  });
};

export const useCustomerReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables) => supportApi.replyToTicket(variables, crypto.randomUUID()),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'my-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to send reply');
    },
  });
};

export const useCustomerAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.uploadMyAttachment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'my-ticket', variables.ticketId] });
    },
  });
};

// ── Admin Hooks ───────────────────────────────────────────────────────────────

export const useAdminTickets = (filters = {}) => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'admin-tickets', filters],
    queryFn: () => supportApi.getAdminTickets(filters),
    enabled: !!user?.id,
    keepPreviousData: true,
  });
};

export const useAdminTicketById = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'admin-ticket', ticketId],
    queryFn: () => supportApi.getAdminTicketById(ticketId),
    enabled: !!ticketId,
  });
};

export const useAdminTicketMessages = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'admin-messages', ticketId],
    queryFn: () => supportApi.getAdminTicketMessages(ticketId),
    enabled: !!ticketId,
    refetchInterval: 10000, // Poll every 10s for admin
  });
};

export const useTicketEvents = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'events', ticketId],
    queryFn: () => supportApi.getTicketEvents(ticketId),
    enabled: !!ticketId,
  });
};

export const useTicketCounts = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'counts'],
    queryFn: supportApi.getTicketCounts,
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh counts every 30s
  });
};

export const useAdminReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.adminReply,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-ticket', variables.ticketId] });
      if (window.toast) window.toast.success('Reply sent');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to reply');
    },
  });
};

export const useAddInternalNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.addInternalNote,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-messages', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support', 'events', variables.ticketId] });
      if (window.toast) window.toast.success('Internal note added');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to add note');
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.updateTicketStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support'] });
      if (window.toast) window.toast.success(`Ticket marked as ${variables.status.replace(/_/g, ' ')}`);
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to update status');
    },
  });
};

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.updateTicketPriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] });
      if (window.toast) window.toast.success('Priority updated');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to update priority');
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.assignTicket,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support'] });
      if (window.toast) window.toast.success('Ticket assigned');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to assign');
    },
  });
};

export const useUpdateTicketTags = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.updateTicketTags,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support'] }),
  });
};

export const useUpdateTicketCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.updateTicketCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support'] }),
  });
};

export const useArchiveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.archiveTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] });
      if (window.toast) window.toast.success('Ticket archived');
    },
  });
};

export const useAdminAttachment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.uploadAdminAttachment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-ticket', variables.ticketId] });
    },
  });
};

// ── Config Hooks ──────────────────────────────────────────────────────────────

export const useTeams = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'teams'],
    queryFn: supportApi.getTeams,
    enabled: !!user?.id,
  });
};

export const useTags = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'tags'],
    queryFn: supportApi.getTags,
    enabled: !!user?.id,
  });
};

export const useAdminAgents = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'agents'],
    queryFn: supportApi.getAdminAgents,
    enabled: !!user?.id,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'teams'] });
      if (window.toast) window.toast.success('Team created');
    },
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'tags'] });
      if (window.toast) window.toast.success('Tag created');
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.deleteTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support', 'tags'] }),
  });
};

// ── CSAT Hooks ────────────────────────────────────────────────────────────────
export const useSubmitCsat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.submitCsatFeedback,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support', 'my-ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support', 'my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support', 'admin-tickets'] });
      if (window.toast) window.toast.success('Thank you for your feedback!');
    },
    onError: (err) => {
      if (window.toast) window.toast.error(err.response?.data?.error || 'Failed to submit feedback');
    },
  });
};

export const useCsatAnalytics = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'csat-analytics'],
    queryFn: supportApi.getCsatAnalytics,
    enabled: !!user?.id,
  });
};

// ── Realtime SSE listener ─────────────────────────────────────────────────────
export const useSupportRealtime = (enabled = true) => {
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
        const sseUrl = `${backendUrl}/api/support/stream?token=${encodeURIComponent(token)}`;
        
        eventSource = new EventSource(sseUrl, { withCredentials: true });
        
        eventSource.addEventListener('connected', (e) => {
          console.log('📶 [SSE] Connected to Support stream:', JSON.parse(e.data));
        });
        
        eventSource.addEventListener('support_update', (e) => {
          const data = JSON.parse(e.data);
          console.log('📡 [SSE] Support update received:', data);
          
          if (data.event === 'typing') {
            window.dispatchEvent(new CustomEvent('support_typing', { detail: data }));
            return;
          }

          if (data.event_type === 'ticket_viewers') {
            window.dispatchEvent(new CustomEvent('support_collision', { detail: data }));
            return;
          }
          
          // Invalidate React Query support caches for immediate updates
          queryClient.invalidateQueries({ queryKey: ['support'] });
        });
        
        eventSource.onerror = (err) => {
          console.warn('📶 [SSE] Support stream disconnected, retrying...', err);
          if (eventSource) eventSource.close();
          setTimeout(() => {
            if (isActive) connect();
          }, 5000);
        };
      } catch (err) {
        console.error('❌ [SSE] Connection failed:', err);
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

// ── Canned Responses Hooks ───────────────────────────────────────────────────
export const useCannedResponses = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'canned-responses'],
    queryFn: supportApi.getCannedResponses,
    enabled: !!user?.id,
  });
};

export const useCreateCannedResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createCannedResponse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support', 'canned-responses'] });
      if (window.toast) window.toast.success('Canned response saved');
    },
  });
};

// ── Presence & Performance Hooks ──────────────────────────────────────────────
export const useAgentPresence = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'agent-presence'],
    queryFn: supportApi.getAgentPresence,
    enabled: !!user?.id,
    refetchInterval: 15000,
  });
};

export const usePerformanceAnalytics = () => {
  const { user } = useUser();
  return useQuery({
    queryKey: ['support', 'performance-analytics'],
    queryFn: supportApi.getPerformanceAnalytics,
    enabled: !!user?.id,
  });
};

// ── Typing Indicator Hooks ────────────────────────────────────────────────────
export const useSendTypingStatus = () => {
  return useMutation({
    mutationFn: supportApi.sendTypingStatus,
  });
};

// ── Collision Detection Hook ──────────────────────────────────────────────────
export const useTicketCollision = (ticketId) => {
  const [viewers, setViewers] = useState([]);

  useEffect(() => {
    if (!ticketId) return;

    supportApi.registerTicketView(ticketId).catch(() => {});

    return () => {
      supportApi.unregisterTicketView(ticketId).catch(() => {});
    };
  }, [ticketId]);

  useEffect(() => {
    const handleCollisionEvent = (e) => {
      const { ticketId: eventTicketId, viewers: eventViewers } = e.detail;
      if (eventTicketId === ticketId) {
        setViewers(eventViewers);
      }
    };

    window.addEventListener('support_collision', handleCollisionEvent);
    return () => window.removeEventListener('support_collision', handleCollisionEvent);
  }, [ticketId]);

  return viewers;
};

// ── AI Hooks ────────────────────────────────────────────────────────────────
export const useAiSummarizeTicket = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'ai', 'summarize', ticketId],
    queryFn: () => supportApi.summarizeTicket(ticketId),
    enabled: false, // Trigger manually
  });
};

export const useAiGenerateDraft = (ticketId) => {
  return useQuery({
    queryKey: ['support', 'ai', 'draft', ticketId],
    queryFn: () => supportApi.generateDraft(ticketId),
    enabled: false, // Trigger manually
  });
};
