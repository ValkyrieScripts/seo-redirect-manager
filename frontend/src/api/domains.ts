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
