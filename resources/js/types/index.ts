import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface WebsiteSettingData {
    id: number;
    brandname: string;
    logo: string | null;
    favicon: string | null;
    office_starting_time: string;
    office_closing_time: string;
    office_ipv4_addr: string;
    missing_checkout_early_leave_minutes: number;
    admin_login_2fa_enabled: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    settings?: WebsiteSettingData;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}
