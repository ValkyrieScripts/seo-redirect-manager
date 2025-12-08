// Domain Types
export type DomainStatus = 'active' | 'inactive' | 'pending';

export interface Domain {
  id: number;
  domain_name: string;
  target_url: string;
  status: DomainStatus;
  created_at: string;
  updated_at: string;
  backlink_count?: number;
}

// Backlink Types (simplified)
export interface Backlink {
  id: number;
  domain_id: number;
  linking_site: string;
  url_path: string;
  created_at: string;
}

// Grouped backlinks by path
export interface GroupedBacklink {
  url_path: string;
  count: number;
  linking_sites: string[];
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

// Form Types
export interface DomainFormData {
  domain_name: string;
  target_url: string;
  status?: DomainStatus;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Import stats
export interface ImportStats {
  imported: number;
  skipped: number;
  total_rows: number;
}
