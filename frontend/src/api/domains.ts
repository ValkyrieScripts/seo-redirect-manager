import client from './client';
import type { Domain } from '../types';

export const domainsApi = {
  list: async (): Promise<Domain[]> => {
    const response = await client.get('/domains');
    return response.data;
  },

  get: async (id: number): Promise<Domain> => {
    const response = await client.get(`/domains/${id}`);
    return response.data;
  },

  create: async (data: { domain_name: string; target_url: string }): Promise<Domain> => {
    const response = await client.post('/domains', data);
    return response.data;
  },

  update: async (id: number, data: Partial<{ domain_name: string; target_url: string; status: string }>): Promise<Domain> => {
    const response = await client.put(`/domains/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/domains/${id}`);
  },
};
