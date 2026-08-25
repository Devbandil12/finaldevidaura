import { httpClient } from '../client/httpClient.js';

export const calculateShipping = async (data) => (await httpClient.post(`/shipping/calculate`, data)).data;
export const trackShipment = async (awb) => (await httpClient.get(`/shipping/track/${awb}`)).data;
