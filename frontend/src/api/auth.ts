import client from './client';
import type { AuthResponse, User } from '@/types';

export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  verify: async (): Promise<User> => {
    const response = await client.get<{ user: User }>('/auth/verify');
    return response.data.user;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await client.post('/auth/change-password', { currentPassword, newPassword });
  },
};
