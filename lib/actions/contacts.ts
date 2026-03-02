import { ApiResponse } from '@/types/api.types';
import { apiClient } from '../apiClient/apiClient';
import { Contact } from '@/types/contacts.types';

export const getMyContacts = async (token: string): Promise<Contact[]> => {
  const res = await apiClient.get('/api/contacts/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const createContacts = async (
  token: string,
  data: { name: string; username: string },
): Promise<ApiResponse> => {
  const res = await apiClient.post('/api/contacts', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
