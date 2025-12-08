import client from './client';
import { Backlink, GroupedBacklinks } from '../types';

export async function getBacklinks(domainId: number): Promise<Backlink[]> {
  const response = await client.get<Backlink[]>(`/backlinks/${domainId}`);
  return response.data;
}

export async function getGroupedBacklinks(domainId: number): Promise<GroupedBacklinks[]> {
  const response = await client.get<GroupedBacklinks[]>(`/backlinks/grouped/${domainId}`);
  return response.data;
}

interface ImportResult {
  imported: number;
  errors?: string[];
  backlinks: Backlink[];
}

export async function importBacklinks(domainId: number, csvData: string): Promise<ImportResult> {
  const response = await client.post<ImportResult>('/backlinks/import', {
    domain_id: domainId,
    csv_data: csvData,
  });
  return response.data;
}

export async function deleteBacklink(id: number): Promise<void> {
  await client.delete(`/backlinks/${id}`);
}

export async function deleteAllBacklinks(domainId: number): Promise<void> {
  await client.delete(`/backlinks/domain/${domainId}`);
}
