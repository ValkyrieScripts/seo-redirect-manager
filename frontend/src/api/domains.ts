import client from './client';
import { Domain, DomainWithBacklinks } from '../types';

export async function getDomains(): Promise<Domain[]> {
  const response = await client.get<Domain[]>('/domains');
  return response.data;
}

export async function getDomain(id: number): Promise<DomainWithBacklinks> {
  const response = await client.get<DomainWithBacklinks>(`/domains/${id}`);
  return response.data;
}

export interface CreateDomainInput {
  domain_name: string;
  target_url: string;
  redirect_mode?: 'full' | 'path-specific';
  unmatched_behavior?: '404' | 'homepage';
  notes?: string;
  priority?: number;
}

export async function createDomain(data: CreateDomainInput): Promise<Domain> {
  const response = await client.post<Domain>('/domains', data);
  return response.data;
}

export async function updateDomain(id: number, data: Partial<CreateDomainInput>): Promise<Domain> {
  const response = await client.put<Domain>(`/domains/${id}`, data);
  return response.data;
}

export async function deleteDomain(id: number): Promise<void> {
  await client.delete(`/domains/${id}`);
}

export async function activateDomain(id: number): Promise<Domain> {
  const response = await client.post<Domain>(`/domains/${id}/activate`);
  return response.data;
}

export async function deactivateDomain(id: number): Promise<Domain> {
  const response = await client.post<Domain>(`/domains/${id}/deactivate`);
  return response.data;
}

export interface PathCheckResult {
  url: string;
  path: string;
  status: 'ok' | 'warning' | 'error';
  redirecting: boolean;
  statusCode?: number;
  redirectUrl?: string;
  matchesTarget?: boolean;
  message: string;
}

export interface RedirectCheckResult {
  mode: 'full' | 'path-specific';
  status: 'ok' | 'warning' | 'error';
  message: string;
  totalPaths?: number;
  checkedPaths?: number;
  results: PathCheckResult[];
}

export async function checkRedirect(id: number): Promise<RedirectCheckResult> {
  const response = await client.get<RedirectCheckResult>(`/domains/${id}/check-redirect`);
  return response.data;
}

export interface BulkUpdateResult {
  message: string;
  updated_count: number;
  new_target_url: string;
}

export async function bulkUpdateTargetUrl(
  newTargetUrl: string,
  domainIds?: number[]
): Promise<BulkUpdateResult> {
  const response = await client.post<BulkUpdateResult>('/domains/bulk/update-target', {
    new_target_url: newTargetUrl,
    domain_ids: domainIds
  });
  return response.data;
}

export async function reloadNginx(): Promise<{ message: string }> {
  const response = await client.post<{ message: string }>('/nginx/reload');
  return response.data;
}
