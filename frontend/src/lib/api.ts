import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// === TYPES ===
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface Fiche {
  id: string;
  user_id: string;
  titre: string;
  status: 'draft' | 'published' | 'archived';
  infrastructure?: string;
  unspsc_code?: string;
  unspsc_desc?: string;
  localisation?: string;
  contrainte?: string;
  environnement?: string;
  lignerouge?: string;
  technologie?: string;
  ingenierie?: string;
  securite?: string;
  metrique1_val?: string;
  metrique1_titre?: string;
  metrique1_desc?: string;
  metrique2_val?: string;
  metrique2_titre?: string;
  metrique2_desc?: string;
  metrique3_val?: string;
  metrique3_titre?: string;
  metrique3_desc?: string;
  citation?: string;
  auteur?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface GenerateResponse {
  success: boolean;
  data: Omit<Fiche, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  meta: {
    tokens: {
      inputTokens: number;
      outputTokens: number;
    };
    generatedAt: string;
  };
}

// === AUTH ===
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post<{ token: string; user: User }>('/api/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/api/auth/login', data),

  me: () => api.get<User>('/api/auth/me'),
};

// === FICHES ===
export const fichesApi = {
  list: (params?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) =>
    api.get<{
      fiches: Fiche[];
      total: number;
      limit: number;
      offset: number;
    }>('/api/fiches', { params }),

  get: (id: string) => api.get<Fiche>(`/api/fiches/${id}`),

  create: (data: Partial<Fiche>) => api.post<Fiche>('/api/fiches', data),

  update: (id: string, data: Partial<Fiche>) =>
    api.put<Fiche>(`/api/fiches/${id}`, data),

  delete: (id: string) => api.delete<{ success: boolean; id: string }>(`/api/fiches/${id}`),

  publish: (id: string) =>
    api.post<{ success: boolean; fiche: Fiche }>(`/api/fiches/${id}/publish`),
};

// === GENERATION ===
export const generateApi = {
  generate: (input: string, context?: string) =>
    api.post<GenerateResponse>('/api/generate', { input, context }),

  improve: (fieldName: string, currentValue: string, context?: string) =>
    api.post<{ success: boolean; improved: string }>('/api/generate/improve', {
      fieldName,
      currentValue,
      context,
    }),

  test: () => api.get<{ success: boolean; message: string; model: string }>('/api/generate/test'),
};

export default api;
