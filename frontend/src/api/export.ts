import client from './client';
import type { DashboardStats } from '@/types';

interface ExportParams {
  domain_ids?: number[];
  project_ids?: number[];
}

export const exportApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await client.get<DashboardStats>('/export/stats');
    return response.data;
  },

  getIndexNow: async (params?: ExportParams): Promise<string> => {
    const response = await client.get<string>('/export/indexnow', {
      params,
      responseType: 'text',
    });
    return response.data;
  },

  getUrls: async (params?: ExportParams): Promise<string> => {
    const response = await client.get<string>('/export/urls', {
      params,
      responseType: 'text',
    });
    return response.data;
  },

  getCsv: async (params?: ExportParams): Promise<string> => {
    const response = await client.get<string>('/export/csv', {
      params,
      responseType: 'text',
    });
    return response.data;
  },

  getNginxConfig: async (params?: ExportParams): Promise<string> => {
    const response = await client.get<string>('/nginx/config', {
      params,
      responseType: 'text',
    });
    return response.data;
  },

  getLuaRules: async (params?: ExportParams): Promise<string> => {
    const response = await client.get<string>('/nginx/lua', {
      params,
      responseType: 'text',
    });
    return response.data;
  },
};
