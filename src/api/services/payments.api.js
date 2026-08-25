import { httpClient } from '../client/httpClient.js';

export const getPaymentStatus = async (id) => (await httpClient.get(`/payments/${id}`)).data;
