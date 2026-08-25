import { httpClient } from '../client/httpClient.js';

export const sendPhoneOtp = async (data) => (await httpClient.post(`/verification/phone/send`, data)).data;
export const verifyPhoneOtp = async (data) => (await httpClient.post(`/verification/phone/verify`, data)).data;
