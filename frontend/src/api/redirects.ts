import client from './client';
import type { Redirect, RedirectFormData } from '@/types';

interface RedirectListParams {
  domain_id?: number;
}

interface TestRedirectResult {
  matched: boolean;
  source_path: string;
  target_url: string | null;
  redirect_type: string | null;
  redirect_id: number | null;
}

export const redirectsApi = {
  list: async (params?: RedirectListParams): Promise<Redirect[]> => {
    const response = await client.get<Redirect[]>('/redirects', { params });
    return response.data;
  },

  get: async (id: number): Promise<Redirect> => {
    const response = await client.get<Redirect>(`/redirects/${id}`);
    return response.data;
  },

  create: async (data: RedirectFormData): Promise<Redirect> => {
    const response = await client.post<Redirect>('/redirects', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RedirectFormData>): Promise<Redirect> => {
    const response = await client.put<Redirect>(`/redirects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/redirects/${id}`);
  },

  bulkCreate: async (redirects: Omit<RedirectFormData, 'notes'>[]): Promise<{ created: number; errors: string[] }> => {
    const response = await client.post<{ created: number; errors: string[] }>('/redirects/bulk', { redirects });
    return response.data;
  },

  test: async (domain_id: number, path: string): Promise<TestRedirectResult> => {
    const response = await client.post<TestRedirectResult>('/redirects/test', { domain_id, path });
    return response.data;
  },
};
