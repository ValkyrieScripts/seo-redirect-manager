export interface User {
  id: number;
  username: string;
}

export interface Domain {
  id: number;
  domain_name: string;
  target_url: string;
  status: 'active' | 'inactive' | 'pending';
  backlink_count?: number;
  created_at: string;
}

export interface GroupedBacklink {
  url_path: string;
  count: number;
  linking_sites: string[];
}
