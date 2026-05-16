import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  User,
  Problem,
  Tag,
  Submission,
  Contest,
  ContestParticipant,
  LeaderboardEntry,
  GlobalRankingEntry,
  UserStats,
  DiscussionPost,
  DiscussionReply,
  CodeFavorite,
  CodeNote,
  ProblemStatus,
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
  
  updateProfile: async (data: Partial<{ nickname: string; avatar: string | null; bio: string; password: string }>) => {
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
    status?: ProblemStatus;
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
  submit: async (data: { problemId: string; code: string; language: string; contestId?: string; contestProblemId?: string }) => {
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

  listProblemAccepted: async (problemId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>(`/submissions/problem/${problemId}/accepted`, { params });
    return res.data;
  },
};

export const contestApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: 'UPCOMING' | 'RUNNING' | 'ENDED';
    search?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Contest>>('/contests', { params });
    return res.data;
  },

  get: async (slug: string) => {
    const res = await api.get<ApiResponse<{ contest: Contest }>>(`/contests/${slug}`);
    return res.data;
  },

  create: async (data: Partial<Contest>) => {
    const res = await api.post<ApiResponse<{ contest: Contest }>>('/contests', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Contest>) => {
    const res = await api.put<ApiResponse<{ contest: Contest }>>(`/contests/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/contests/${id}`);
    return res.data;
  },

  register: async (contestId: string) => {
    const res = await api.post<ApiResponse<{ participant: ContestParticipant }>>(`/contests/${contestId}/register`);
    return res.data;
  },

  getProblems: async (contestId: string) => {
    const res = await api.get<ApiResponse<{ problems: any[] }>>(`/contests/${contestId}/problems`);
    return res.data;
  },

  getProblem: async (contestId: string, index: string) => {
    const res = await api.get<ApiResponse<{ problem: Problem }>>(`/contests/${contestId}/problems/${index}`);
    return res.data;
  },

  submit: async (contestId: string, data: {
    problemIndex: string;
    code: string;
    language: string;
  }) => {
    const res = await api.post<ApiResponse<{ submission: Submission }>>(`/contests/${contestId}/submit`, data);
    return res.data;
  },

  getSubmissions: async (contestId: string, params?: {
    page?: number;
    limit?: number;
    problemIndex?: string;
    userId?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>(`/contests/${contestId}/submissions`, { params });
    return res.data;
  },

  getMySubmissions: async (contestId: string, params?: {
    page?: number;
    limit?: number;
    problemIndex?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>(`/contests/${contestId}/submissions/me`, { params });
    return res.data;
  },

  getLeaderboard: async (contestId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<ApiResponse<{
      leaderboard: LeaderboardEntry[];
      contest: Contest;
      currentUserRank?: LeaderboardEntry;
      pagination?: {
        currentPage: number;
        totalPages: number;
      };
    }>>(`/contests/${contestId}/leaderboard`, { params });
    return res.data;
  },

  freeze: async (contestId: string) => {
    const res = await api.post<ApiResponse<null>>(`/contests/${contestId}/freeze`);
    return res.data;
  },

  unfreeze: async (contestId: string) => {
    const res = await api.post<ApiResponse<null>>(`/contests/${contestId}/unfreeze`);
    return res.data;
  },

  addProblem: async (contestId: string, data: {
    problemId: string;
    index: string;
    score?: number;
  }) => {
    const res = await api.post<ApiResponse<null>>(`/contests/${contestId}/problems`, data);
    return res.data;
  },

  removeProblem: async (contestId: string, contestProblemId: string) => {
    const res = await api.delete<ApiResponse<null>>(`/contests/${contestId}/problems/${contestProblemId}`);
    return res.data;
  },
};

export const rankingApi = {
  getGlobal: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const res = await api.get<ApiResponse<{
      rankings: GlobalRankingEntry[];
      currentUserRank?: number;
      pagination?: {
        currentPage: number;
        totalPages: number;
      };
    }>>('/rankings/global', { params });
    return res.data;
  },

  getUserStats: async (userId?: string) => {
    const url = userId ? `/rankings/user/${userId}` : '/rankings/my';
    const res = await api.get<ApiResponse<{ stats: UserStats }>>(url);
    return res.data;
  },
};

export const adminProblemApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    status?: ProblemStatus;
    search?: string;
  }) => {
    const res = await api.get<PaginatedResponse<Problem>>('/admin/problems', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<ApiResponse<{ problem: Problem }>>(`/admin/problems/${id}`);
    return res.data;
  },

  create: async (data: Partial<Problem>) => {
    const res = await api.post<ApiResponse<{ problem: Problem }>>('/admin/problems', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Problem>) => {
    const res = await api.put<ApiResponse<{ problem: Problem }>>(`/admin/problems/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/admin/problems/${id}`);
    return res.data;
  },

  submitReview: async (id: string) => {
    const res = await api.post<ApiResponse<null>>(`/admin/problems/${id}/submit-review`);
    return res.data;
  },

  review: async (id: string, data: {
    status: 'PUBLISHED' | 'REJECTED';
    reviewComment?: string;
  }) => {
    const res = await api.post<ApiResponse<null>>(`/admin/problems/${id}/review`, data);
    return res.data;
  },

  uploadTestCases: async (problemId: string, formData: FormData) => {
    const res = await api.post<ApiResponse<{ uploaded: string[] }>>(
      `/admin/problems/${problemId}/testcases`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  listTestCases: async (problemId: string) => {
    const res = await api.get<ApiResponse<{ testCases: string[] }>>(`/admin/problems/${problemId}/testcases`);
    return res.data;
  },

  deleteTestCase: async (problemId: string, filename: string) => {
    const res = await api.delete<ApiResponse<null>>(`/admin/problems/${problemId}/testcases/${filename}`);
    return res.data;
  },

  bulkImport: async (formData: FormData) => {
    const res = await api.post<ApiResponse<{ imported: number; failed: number; errors: string[] }>>(
      '/admin/problems/bulk-import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  getStats: async (id: string) => {
    const res = await api.get<ApiResponse<{
      stats: {
        totalSubmissions: number;
        acceptedSubmissions: number;
        acceptanceRate: number;
        avgAttempts: number;
      };
    }>>(`/admin/problems/${id}/stats`);
    return res.data;
  },
};

export const discussionApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    problemId?: string;
    contestId?: string;
    sort?: 'NEWEST' | 'HOTTEST';
    search?: string;
  }) => {
    const res = await api.get<PaginatedResponse<DiscussionPost>>('/discussions', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await api.get<ApiResponse<{ post: DiscussionPost }>>(`/discussions/${id}`);
    return res.data;
  },

  create: async (data: {
    title: string;
    content: string;
    problemId?: string;
    contestId?: string;
  }) => {
    const res = await api.post<ApiResponse<{ post: DiscussionPost }>>('/discussions', data);
    return res.data;
  },

  update: async (id: string, data: Partial<{ title: string; content: string }>) => {
    const res = await api.put<ApiResponse<{ post: DiscussionPost }>>(`/discussions/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/discussions/${id}`);
    return res.data;
  },

  togglePin: async (id: string) => {
    const res = await api.post<ApiResponse<null>>(`/discussions/${id}/pin`);
    return res.data;
  },

  toggleLock: async (id: string) => {
    const res = await api.post<ApiResponse<null>>(`/discussions/${id}/lock`);
    return res.data;
  },

  like: async (id: string) => {
    const res = await api.post<ApiResponse<null>>(`/discussions/${id}/like`);
    return res.data;
  },

  listReplies: async (postId: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<PaginatedResponse<DiscussionReply>>(`/discussions/${postId}/replies`, { params });
    return res.data;
  },

  createReply: async (postId: string, data: {
    content: string;
    parentId?: string;
  }) => {
    const res = await api.post<ApiResponse<{ reply: DiscussionReply }>>(`/discussions/${postId}/replies`, data);
    return res.data;
  },

  updateReply: async (postId: string, replyId: string, data: { content: string }) => {
    const res = await api.put<ApiResponse<{ reply: DiscussionReply }>>(`/discussions/${postId}/replies/${replyId}`, data);
    return res.data;
  },

  deleteReply: async (postId: string, replyId: string) => {
    const res = await api.delete<ApiResponse<null>>(`/discussions/${postId}/replies/${replyId}`);
    return res.data;
  },

  likeReply: async (postId: string, replyId: string) => {
    const res = await api.post<ApiResponse<null>>(`/discussions/${postId}/replies/${replyId}/like`);
    return res.data;
  },
};

export const codeApi = {
  listFavorites: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<PaginatedResponse<CodeFavorite>>('/code/favorites', { params });
    return res.data;
  },

  addFavorite: async (data: {
    submissionId: string;
    note?: string;
  }) => {
    const res = await api.post<ApiResponse<{ favorite: CodeFavorite }>>('/code/favorites', data);
    return res.data;
  },

  removeFavorite: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/code/favorites/${id}`);
    return res.data;
  },

  listNotes: async (submissionId?: string, params?: {
    page?: number;
    limit?: number;
  }) => {
    const url = submissionId ? `/code/notes/submission/${submissionId}` : '/code/notes';
    const res = await api.get<PaginatedResponse<CodeNote>>(url, { params });
    return res.data;
  },

  createNote: async (data: {
    submissionId: string;
    content: string;
    startLine?: number;
    endLine?: number;
  }) => {
    const res = await api.post<ApiResponse<{ note: CodeNote }>>('/code/notes', data);
    return res.data;
  },

  updateNote: async (id: string, data: Partial<{ content: string; startLine: number; endLine: number }>) => {
    const res = await api.put<ApiResponse<{ note: CodeNote }>>(`/code/notes/${id}`, data);
    return res.data;
  },

  deleteNote: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/code/notes/${id}`);
    return res.data;
  },

  getAcceptedSubmissions: async (problemId: string, params?: {
    page?: number;
    limit?: number;
    sortBy?: 'runtime' | 'memory';
  }) => {
    const res = await api.get<PaginatedResponse<Submission>>(`/code/accepted/${problemId}`, { params });
    return res.data;
  },
};

export default api;
