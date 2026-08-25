import { httpClient } from '../client/httpClient';

export const getAllTickets = async () => {
  const res = await httpClient.get(`/api/contact`);
  return res.data;
};

export const getUserTickets = async (email) => {
  const res = await httpClient.get(`/api/contact/user/${email}`);
  return res.data;
};

export const createTicket = async (ticketData) => {
  const res = await httpClient.post(`/api/contact`, ticketData);
  return res.data;
};

export const replyToTicket = async ({ ticketId, message, senderRole }) => {
  const res = await httpClient.post(`/api/contact/${ticketId}/reply`, { message, senderRole });
  return res.data;
};

export const updateTicketStatus = async ({ ticketId, status }) => {
  const res = await httpClient.patch(`/api/contact/${ticketId}/status`, { status });
  return res.data;
};
