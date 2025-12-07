// Database entity types

export interface Project {
  id: number;
  name: string;
  base_url: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Domain {
  id: number;
  domain_name: string;
  project_id?: number;
  redirect_type: 'full' | 'partial';
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Redirect {
  id: number;
  domain_id: number;
  source_path: string;
  target_url: string;
  redirect_type: '301' | '302';
  is_regex: boolean;
  priority: number;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

export interface Backlink {
  id: number;
  domain_id: number;
  source_url: string;
  source_path: string;
  referring_domain: string;
  anchor_text?: string;
  domain_rating?: number;
  url_rating?: number;
  traffic?: number;
  first_seen?: string;
  last_seen?: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

// API request/response types

export interface CreateProjectRequest {
  name: string;
  base_url: string;
  description?: string;
}

export interface CreateDomainRequest {
  domain_name: string;
  project_id?: number;
  redirect_type?: 'full' | 'partial';
  status?: 'active' | 'inactive' | 'pending';
  notes?: string;
}

export interface CreateRedirectRequest {
  domain_id: number;
  source_path: string;
  target_url: string;
  redirect_type?: '301' | '302';
  is_regex?: boolean;
  priority?: number;
}

export interface ImportBacklinksRequest {
  domain_id: number;
  // CSV data will be in the file upload
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
  };
}

// Export formats
export type ExportFormat = 'indexnow' | 'csv' | 'json' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  domain_ids?: number[];
  project_ids?: number[];
  include_backlinks?: boolean;
}
