import client from './client';
import type { Project, ProjectFormData } from '@/types';

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const response = await client.get<Project[]>('/projects');
    return response.data;
  },

  get: async (id: number): Promise<Project> => {
    const response = await client.get<Project>(`/projects/${id}`);
    return response.data;
  },

  create: async (data: ProjectFormData): Promise<Project> => {
    const response = await client.post<Project>('/projects', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ProjectFormData>): Promise<Project> => {
    const response = await client.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await client.delete(`/projects/${id}`);
  },
};
