import { httpClient } from '../client/httpClient.js';

export const registerUser = async (data) => (await httpClient.post(`/auth/register`, data)).data;
export const loginUser = async (data) => (await httpClient.post(`/auth/login`, data)).data;
