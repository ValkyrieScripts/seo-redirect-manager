import client from './client';
import type { Domain, DomainFormData, DomainStatus } from '@/types';

interface DomainListParams {
  project_id?: number;
  status?: DomainStatus;
}

export const domainsApi = {
  list: async (params?: DomainListParams): Promise<Domain[]> => {
    const response = await client.get<Domain[]>('/domains', { params });
    return response.data;
  },

  get: async (id: number): Promise<Domain> => {
    const response = await client.get<Domain>(`/domains/${id}`);
    return response.data;
  },

  create: async (data: DomainFormData): Promise<Domain> => {
    const response = await client.post<Domain>('/domains', data);
    return response.data;
  },

  update: async (id: number, data: Partial<DomainFormData>): Promise<Domain> => {
    const response = await client.put<Domain>(`/domains/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/domains/${id}`);
  },

  bulkCreate: async (domains: string[]): Promise<{ created: number; errors: string[] }> => {
    const response = await client.post<{ created: number; errors: string[] }>('/domains/bulk', { domains });
    return response.data;
  },
};
