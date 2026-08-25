import { httpClient } from '../client/httpClient.js';

export const getReferrals = async () => (await httpClient.get(`/referrals`)).data;
