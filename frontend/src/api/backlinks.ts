import client from './client';
import type { Backlink, BacklinkPath } from '@/types';

interface BacklinkListParams {
  domain_id?: number;
}

export const backlinksApi = {
  list: async (params?: BacklinkListParams): Promise<Backlink[]> => {
    const response = await client.get<Backlink[]>('/backlinks', { params });
    return response.data;
  },

  import: async (domainId: number, file: File): Promise<{ imported: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain_id', domainId.toString());

    const response = await client.post<{ imported: number; errors: string[] }>('/backlinks/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPaths: async (domainId: number): Promise<BacklinkPath[]> => {
    const response = await client.get<BacklinkPath[]>(`/backlinks/domain/${domainId}/paths`);
    return response.data;
  },

  generateRedirects: async (domainId: number, targetUrl: string): Promise<{ created: number }> => {
    const response = await client.post<{ created: number }>(`/backlinks/domain/${domainId}/generate-redirects`, {
      target_url: targetUrl,
    });
    return response.data;
  },
};
