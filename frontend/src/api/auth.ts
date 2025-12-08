import client from './client';
import { User } from '../types';

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await client.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await client.get<User>('/auth/me');
  return response.data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.post('/auth/change-password', { currentPassword, newPassword });
}
