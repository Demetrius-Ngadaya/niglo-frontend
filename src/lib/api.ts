import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
export const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || 'http://localhost:8000/storage';

export const api = axios.create({ baseURL: API_URL });

export function imageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
}

// ---- Admin auth ----

export function adminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('niglo_admin_token');
}

export function setAdminToken(token: string) {
  localStorage.setItem('niglo_admin_token', token);
}

export function clearAdminToken() {
  localStorage.removeItem('niglo_admin_token');
}

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = adminToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return res.json();
}

// ---- Types ----

export type ServiceCategory = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image_path?: string | null;
  services?: Service[];
};

export type ServiceImage = {
  id: number;
  image_path: string;
  caption?: string | null;
};

export type Service = {
  id: number;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  image_path?: string | null;
  starting_price?: string | null;
  category?: ServiceCategory;
  images?: ServiceImage[];
};

export type PortfolioProject = {
  id: number;
  title: string;
  slug: string;
  client_name?: string | null;
  location?: string | null;
  completed_on?: string | null;
  summary?: string | null;
  description?: string | null;
  cover_image_path?: string | null;
  before_image_path?: string | null;
  after_image_path?: string | null;
  category?: ServiceCategory;
  images?: { id: number; image_path: string; caption?: string | null }[];
};

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_path?: string | null;
  published_at?: string | null;
  category?: { name: string };
};

export type TeamMember = {
  id: number;
  full_name: string;
  position: string;
  bio?: string | null;
  photo_path?: string | null;
};
