import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Problem,
  Tag,
  Submission,
} from '../types';

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: { username: string; email: string; password: string }) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', data);
    return res.data;
  },
  
  login: async (data: { login: string; password: string }) => {
    const res = await api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data);
    return res.data;
  },
  
  getCurrentUser: async () => {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data;
  },
  
  updateProfile: async (data: Partial<{ nickname: string; avatar: string; bio: string; password: string }>) => {
    const res = await api.put<ApiResponse<{ user: User }>>('/auth/profile', data);
    return res.data;
  },
};

export const problemApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    difficulty?: string;
    tag?: string;
    search?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Problem>>('/problems', { params });
    return res.data;
  },
  
  get: async (slug: string) => {
    const res = await api.get<ApiResponse<{ problem: Problem }>>(`/problems/${slug}`);
    return res.data;
  },
  
  create: async (data: Partial<Problem>) => {
    const res = await api.post<ApiResponse<{ problem: Problem }>>('/problems', data);
    return res.data;
  },
  
  listTags: async () => {
    const res = await api.get<ApiResponse<{ tags: Tag[] }>>('/problems/tags');
    return res.data;
  },
};

export const submissionApi = {
  submit: async (data: { problemId: string; code: string; language: string }) => {
    const res = await api.post<ApiResponse<{ submission: Submission }>>('/submissions', data);
    return res.data;
  },
  
  get: async (id: string) => {
    const res = await api.get<ApiResponse<{ submission: Submission }>>(`/submissions/${id}`);
    return res.data;
  },
  
  list: async (params?: {
    page?: number;
    limit?: number;
    problemId?: string;
    userId?: string;
    status?: string;
    language?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>('/submissions', { params });
    return res.data;
  },
  
  listMy: async (params?: {
    page?: number;
    limit?: number;
    problemId?: string;
    status?: string;
    language?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>('/submissions/me', { params });
    return res.data;
  },
};

export default api;
