// Project Types
export interface Project {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  domain_count?: number;
}

// Domain Types
export type DomainStatus = 'active' | 'inactive' | 'pending';

export interface Domain {
  id: number;
  project_id: number | null;
  domain: string;
  status: DomainStatus;
  target_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  redirect_count?: number;
  backlink_count?: number;
}

// Redirect Types
export type RedirectType = '301' | '302' | '307' | '308';

export interface Redirect {
  id: number;
  domain_id: number;
  source_path: string;
  target_url: string;
  redirect_type: RedirectType;
  is_regex: boolean;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  domain_name?: string;
}

// Backlink Types
export interface Backlink {
  id: number;
  domain_id: number;
  referring_page: string;
  target_url: string;
  anchor_text: string | null;
  domain_rating: number | null;
  url_rating: number | null;
  traffic: number | null;
  first_seen: string | null;
  last_seen: string | null;
  created_at: string;
  domain_name?: string;
}

// Stats Types
export interface DashboardStats {
  total_projects: number;
  total_domains: number;
  total_redirects: number;
  total_backlinks: number;
  domains_by_status: {
    active: number;
    inactive: number;
    pending: number;
  };
  recent_domains: Domain[];
  recent_redirects: Redirect[];
}

// Auth Types
export interface User {
  id: number;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Form Types
export interface DomainFormData {
  domain: string;
  project_id: number | null;
  status: DomainStatus;
  target_url: string;
  notes: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
}

export interface RedirectFormData {
  domain_id: number;
  source_path: string;
  target_url: string;
  redirect_type: RedirectType;
  is_regex: boolean;
  priority: number;
  notes: string;
}

// Backlink Path Type
export interface BacklinkPath {
  path: string;
  count: number;
  avg_dr: number;
  avg_ur: number;
  total_traffic: number;
}

// Export Options
export type ExportFormat = 'indexnow' | 'csv' | 'urls';

export interface ExportOptions {
  format: ExportFormat;
  domain_ids?: number[];
  project_ids?: number[];
}
