import { httpClient } from '../client/httpClient.js';

export const createCheckoutSession = async (data) => (await httpClient.post(`/checkout/session`, data)).data;
