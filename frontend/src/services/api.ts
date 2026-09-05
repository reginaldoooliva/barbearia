import axios from 'axios';
import { getItemAsync } from './storage';

// Aponte para o endereço do seu backend NestJS
export const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use(async (config) => {
  const token = await getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
