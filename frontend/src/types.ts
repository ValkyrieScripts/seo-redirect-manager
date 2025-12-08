export interface User {
  id: number;
  username: string;
}

export interface Domain {
  id: number;
  domain_name: string;
  target_url: string;
  redirect_mode: 'full' | 'path-specific';
  unmatched_behavior: '404' | 'homepage';
  status: 'active' | 'inactive';
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  backlink_count?: number;
}

export interface Backlink {
  id: number;
  domain_id: number;
  linking_url: string;
  url_path: string;
  created_at: string;
}

export interface DomainWithBacklinks extends Domain {
  backlinks: Backlink[];
  backlink_count: number;
}

export interface GroupedBacklinks {
  path: string;
  count: number;
  backlinks: Backlink[];
}
