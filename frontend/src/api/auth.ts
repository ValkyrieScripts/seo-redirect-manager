import client from './client';
import type { User } from '../types';

export const authApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const response = await client.post('/auth/login', { username, password });
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await client.post('/auth/change-password', { currentPassword, newPassword });
  },
};
