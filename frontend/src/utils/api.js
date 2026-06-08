import axios from 'axios';

const api = axios.create({
  baseURL: 'https://ikonex-academy-test.onrender.com/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { message: 'Network error' })
);

export default api;
