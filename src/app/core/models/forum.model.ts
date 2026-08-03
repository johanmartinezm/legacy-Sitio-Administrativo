export interface Forum {
  id: string;
  title: string;
  description: string;
  cover_url: string;
  status: 'active' | 'locked' | 'hidden' | 'deleted';
  created_by_user_id?: string;
  created_by_admin: boolean;
  author_alias?: string;
  post_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ForumPost {
  id: string;
  forum_id: string;
  parent_id?: string;
  author_alias: string;
  content: string;
  image_url: string;
  status: 'active' | 'deleted' | 'flagged';
  reply_count?: number;
  report_count?: number;
  created_at: string;
}
