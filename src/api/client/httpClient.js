import axios from 'axios';
import { setupAuthInterceptor } from './auth.js';
import { setupErrorInterceptor } from './errors.js';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

export const httpClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach interceptors
setupAuthInterceptor(httpClient);
setupErrorInterceptor(httpClient);
