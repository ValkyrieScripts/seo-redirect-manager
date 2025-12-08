import client from './client';
import type { Backlink, GroupedBacklink, ImportStats } from '@/types';

export const backlinksApi = {
  // Get all backlinks for a domain
  list: async (domainId: number): Promise<Backlink[]> => {
    const response = await client.get<Backlink[]>('/backlinks', {
      params: { domain_id: domainId },
    });
    return response.data;
  },

  // Get backlinks grouped by path (with counts and linking sites)
  getGrouped: async (domainId: number): Promise<GroupedBacklink[]> => {
    const response = await client.get<GroupedBacklink[]>(`/backlinks/grouped/${domainId}`);
    return response.data;
  },

  // Import backlinks from CSV/TXT file (format: linking_site,url_path)
  import: async (domainId: number, file: File): Promise<ImportStats> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain_id', domainId.toString());

    const response = await client.post<{ message: string; stats: ImportStats; total_rows: number }>(
      '/backlinks/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return {
      imported: response.data.stats.imported,
      skipped: response.data.stats.skipped,
      total_rows: response.data.total_rows,
    };
  },

  // Delete all backlinks for a domain
  deleteAll: async (domainId: number): Promise<{ count: number }> => {
    const response = await client.delete<{ message: string; count: number }>(`/backlinks/domain/${domainId}`);
    return { count: response.data.count };
  },

  // Delete single backlink
  delete: async (id: number): Promise<void> => {
    await client.delete(`/backlinks/${id}`);
  },
};
