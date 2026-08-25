import { httpClient } from '../client/httpClient.js';

export const getRewards = async () => (await httpClient.get(`/rewards`)).data;
