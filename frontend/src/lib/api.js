import axios from 'axios';

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(message));
  }
);

export const formatCurrency = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
