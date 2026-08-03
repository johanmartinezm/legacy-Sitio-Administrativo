export interface Banner {
    id?: string;
    title: string;
    subtitle?: string;
    category: 'home' | 'community';
    image_url: string;
    action_type: 'none' | 'route' | 'link';
    action_target?: string;
    is_active: boolean;
    sort_order: number;
    created_at?: Date;
    updated_at?: Date;
}
