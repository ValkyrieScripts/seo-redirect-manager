import client from './client';
import type { GroupedBacklink } from '../types';

export const backlinksApi = {
  getGrouped: async (domainId: number): Promise<GroupedBacklink[]> => {
    const response = await client.get(`/backlinks/grouped/${domainId}`);
    return response.data;
  },

  import: async (domainId: number, file: File): Promise<{ imported: number; skipped: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain_id', domainId.toString());
    const response = await client.post('/backlinks/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.stats;
  },

  deleteAll: async (domainId: number): Promise<void> => {
    await client.delete(`/backlinks/domain/${domainId}`);
  },
};
