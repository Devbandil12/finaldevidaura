import { httpClient } from '../client/httpClient';

// ── Customer Endpoints ────────────────────────────────────────────────────────

export const getMyTickets = async ({ page = 1, limit = 20 } = {}) => {
  const res = await httpClient.get(`/api/support/me/tickets`, { params: { page, limit } });
  return res.data;
};

export const getMyTicketById = async (id) => {
  const res = await httpClient.get(`/api/support/me/tickets/${id}`);
  return res.data;
};

export const getMyTicketMessages = async (id, { limit = 50, before } = {}) => {
  const res = await httpClient.get(`/api/support/me/tickets/${id}/messages`, {
    params: { limit, ...(before && { before }) },
  });
  return res.data;
};

export const createTicket = async (ticketData, idempotencyKey) => {
  const res = await httpClient.post(`/api/support/me/tickets`, ticketData, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  });
  return res.data;
};

export const createGuestTicket = async (ticketData, idempotencyKey) => {
  const res = await httpClient.post(`/api/support/tickets/guest`, ticketData, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  });
  return res.data;
};

export const replyToTicket = async ({ ticketId, message }, idempotencyKey) => {
  const res = await httpClient.post(`/api/support/me/tickets/${ticketId}/messages`, { message }, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
  });
  return res.data;
};

export const uploadMyAttachment = async ({ ticketId, file }) => {
  // 1. Get presigned URL
  const presignRes = await httpClient.post(`/api/support/me/tickets/${ticketId}/attachments/presign`, {
    fileName: file.name,
    mimeType: file.type,
  });
  const { presignedUrl, key, url } = presignRes.data;

  // 2. Upload directly to Cloudflare R2
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. Save metadata in backend
  const res = await httpClient.post(`/api/support/me/tickets/${ticketId}/attachments`, {
    storageKey: key,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url,
  });
  return res.data;
};

// ── Admin Endpoints ───────────────────────────────────────────────────────────

export const getAdminTickets = async (filters = {}) => {
  const res = await httpClient.get(`/api/support/tickets`, { params: filters });
  return res.data;
};

export const getAdminTicketById = async (id) => {
  const res = await httpClient.get(`/api/support/tickets/${id}`);
  return res.data;
};

export const getAdminTicketMessages = async (id, { limit = 50, before } = {}) => {
  const res = await httpClient.get(`/api/support/tickets/${id}/messages`, {
    params: { limit, ...(before && { before }) },
  });
  return res.data;
};

export const getTicketEvents = async (id) => {
  const res = await httpClient.get(`/api/support/tickets/${id}/events`);
  return res.data;
};

export const adminReply = async ({ ticketId, message }) => {
  const res = await httpClient.post(`/api/support/tickets/${ticketId}/messages`, { message });
  return res.data;
};

export const addInternalNote = async ({ ticketId, note }) => {
  const res = await httpClient.post(`/api/support/tickets/${ticketId}/notes`, { note });
  return res.data;
};

export const updateTicketStatus = async ({ ticketId, status }) => {
  const res = await httpClient.patch(`/api/support/tickets/${ticketId}/status`, { status });
  return res.data;
};

export const updateTicketPriority = async ({ ticketId, priority }) => {
  const res = await httpClient.patch(`/api/support/tickets/${ticketId}/priority`, { priority });
  return res.data;
};

export const assignTicket = async ({ ticketId, agentId, teamId }) => {
  const res = await httpClient.patch(`/api/support/tickets/${ticketId}/assign`, { agentId, teamId });
  return res.data;
};

export const updateTicketTags = async ({ ticketId, tags }) => {
  const res = await httpClient.patch(`/api/support/tickets/${ticketId}/tags`, { tags });
  return res.data;
};

export const updateTicketCategory = async ({ ticketId, category, subcategory }) => {
  const res = await httpClient.patch(`/api/support/tickets/${ticketId}/category`, { category, subcategory });
  return res.data;
};

export const archiveTicket = async (ticketId) => {
  const res = await httpClient.delete(`/api/support/tickets/${ticketId}`);
  return res.data;
};

export const uploadAdminAttachment = async ({ ticketId, file }) => {
  // 1. Get presigned URL
  const presignRes = await httpClient.post(`/api/support/tickets/${ticketId}/attachments/presign`, {
    fileName: file.name,
    mimeType: file.type,
  });
  const { presignedUrl, key, url } = presignRes.data;

  // 2. Upload directly to Cloudflare R2
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  // 3. Save metadata in backend
  const res = await httpClient.post(`/api/support/tickets/${ticketId}/attachments`, {
    storageKey: key,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url,
  });
  return res.data;
};

export const getTicketCounts = async () => {
  const res = await httpClient.get(`/api/support/tickets/counts`);
  return res.data;
};

// ── Config Endpoints ──────────────────────────────────────────────────────────

export const getTeams = async () => {
  const res = await httpClient.get(`/api/support/teams`);
  return res.data;
};

export const createTeam = async (teamData) => {
  const res = await httpClient.post(`/api/support/teams`, teamData);
  return res.data;
};

export const getTags = async () => {
  const res = await httpClient.get(`/api/support/tags`);
  return res.data;
};

export const createTag = async (tagData) => {
  const res = await httpClient.post(`/api/support/tags`, tagData);
  return res.data;
};

export const deleteTag = async (tagId) => {
  const res = await httpClient.delete(`/api/support/tags/${tagId}`);
  return res.data;
};

export const getAdminAgents = async () => {
  const res = await httpClient.get(`/api/support/agents`);
  return res.data;
};

// ── CSAT Endpoints ────────────────────────────────────────────────────────────
export const submitCsatFeedback = async ({ ticketId, rating, comment }) => {
  const res = await httpClient.post(`/api/support/me/tickets/${ticketId}/feedback`, { rating, comment });
  return res.data;
};

export const getCsatAnalytics = async () => {
  const res = await httpClient.get(`/api/support/analytics/csat`);
  return res.data;
};

// ── Canned Responses Endpoints ────────────────────────────────────────────────
export const getCannedResponses = async () => {
  const res = await httpClient.get(`/api/support/canned-responses`);
  return res.data;
};

export const createCannedResponse = async (data) => {
  const res = await httpClient.post(`/api/support/canned-responses`, data);
  return res.data;
};

// ── Presence & Performance Endpoints ──────────────────────────────────────────
export const getAgentPresence = async () => {
  const res = await httpClient.get(`/api/support/agents/presence`);
  return res.data;
};

export const getPerformanceAnalytics = async () => {
  const res = await httpClient.get(`/api/support/analytics/performance`);
  return res.data;
};

// ── Typing Indicator Endpoints ────────────────────────────────────────────────
export const sendTypingStatus = async ({ ticketId, isTyping }) => {
  const res = await httpClient.post(`/api/support/tickets/${ticketId}/typing`, { isTyping });
  return res.data;
};

// ── Collaborative Collision Detection Endpoints ──────────────────────────────
export const registerTicketView = async (ticketId) => {
  const res = await httpClient.post(`/api/support/tickets/${ticketId}/view`);
  return res.data;
};

export const unregisterTicketView = async (ticketId) => {
  const res = await httpClient.delete(`/api/support/tickets/${ticketId}/view`);
  return res.data;
};

// ── AI Endpoints ─────────────────────────────────────────────────────────────
export const summarizeTicket = async (ticketId) => {
  const res = await httpClient.get(`/api/support/ai/admin/ticket/${ticketId}/summarize`);
  return res.data;
};

export const generateDraft = async (ticketId) => {
  const res = await httpClient.get(`/api/support/ai/admin/ticket/${ticketId}/draft`);
  return res.data;
};
