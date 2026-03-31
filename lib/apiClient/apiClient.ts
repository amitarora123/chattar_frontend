import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URI!,
  withCredentials: true,
});

apiClient.interceptors.request.use(async (config) => {

  console.log(config.baseURL)
  let token: string | undefined;

  if (typeof window === 'undefined') {
    const { auth } = await import('../../auth');
    const session = await auth();
    token = session?.token;
  } else {
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    token = session?.token;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
