import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASEURI || 'http://localhost:3000',
  withCredentials: true,
});
