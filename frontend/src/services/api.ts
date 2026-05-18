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
  PlagiarismReport,
  PlagiarismMatch,
  CheatingRecord,
  JudgeNode,
  JudgeQueueStatus,
  ProblemSet,
  ProblemSetProgress,
  ProblemHint,
  UserWeakTag,
  LearningPathRecommendation,
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
    action: 'approve' | 'reject';
    comment?: string;
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

export const plagiarismApi = {
  createReport: async (data: {
    problemId?: string;
    contestId?: string;
    type: 'PROBLEM' | 'CONTEST' | 'MANUAL';
    algorithm?: 'TOKEN_SIMILARITY' | 'AST_SIMILARITY' | 'MOSS' | 'SIMIAN';
    threshold?: number;
  }) => {
    const res = await api.post<ApiResponse<PlagiarismReport>>('/plagiarism/reports', data);
    return res.data;
  },

  listReports: async (params?: {
    page?: number;
    limit?: number;
    status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    type?: 'PROBLEM' | 'CONTEST' | 'MANUAL';
    problemId?: string;
    contestId?: string;
  }) => {
    const res = await api.get<PaginatedResponse<PlagiarismReport>>('/plagiarism/reports', { params });
    return res.data;
  },

  getReport: async (id: string) => {
    const res = await api.get<ApiResponse<PlagiarismReport>>(`/plagiarism/reports/${id}`);
    return res.data;
  },

  listMatches: async (params?: {
    reportId?: string;
    page?: number;
    limit?: number;
    status?: 'PENDING_REVIEW' | 'REVIEWED' | 'CONFIRMED_CHEATING' | 'FALSE_POSITIVE';
    minSimilarity?: number;
  }) => {
    const res = await api.get<PaginatedResponse<PlagiarismMatch>>('/plagiarism/matches', { params });
    return res.data;
  },

  getMatch: async (id: string) => {
    const res = await api.get<ApiResponse<PlagiarismMatch>>(`/plagiarism/matches/${id}`);
    return res.data;
  },

  reviewMatch: async (id: string, data: {
    status: 'PENDING_REVIEW' | 'REVIEWED' | 'CONFIRMED_CHEATING' | 'FALSE_POSITIVE';
    reviewComment?: string;
  }) => {
    const res = await api.put<ApiResponse<PlagiarismMatch>>(`/plagiarism/matches/${id}/review`, data);
    return res.data;
  },

  createCheatingRecord: async (data: {
    userId: string;
    contestId?: string;
    submissionId?: string;
    plagiarismMatchId?: string;
    type: 'PLAGIARISM' | 'COLLUSION' | 'MULTIPLE_ACCOUNTS' | 'IP_SHARING' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    punishment: 'WARNING' | 'SCORE_CANCELLATION' | 'CONTEST_DISQUALIFICATION' | 'TEMPORARY_BAN' | 'PERMANENT_BAN';
    description?: string;
    evidence?: Record<string, any>;
  }) => {
    const res = await api.post<ApiResponse<CheatingRecord>>('/plagiarism/cheating', data);
    return res.data;
  },

  listCheatingRecords: async (params?: {
    userId?: string;
    contestId?: string;
    type?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get<PaginatedResponse<CheatingRecord>>('/plagiarism/cheating', { params });
    return res.data;
  },

  checkSuspiciousActivity: async (userId: string) => {
    const res = await api.get<ApiResponse<any[]>>(`/plagiarism/suspicious/${userId}`);
    return res.data;
  },

  appealCheatingRecord: async (id: string, data: { appealComment: string }) => {
    const res = await api.post<ApiResponse<CheatingRecord>>(`/plagiarism/cheating/${id}/appeal`, data);
    return res.data;
  },

  reviewAppeal: async (id: string, data: { appealDecision: 'UPHELD' | 'OVERTURNED' | 'REDUCED' }) => {
    const res = await api.put<ApiResponse<CheatingRecord>>(`/plagiarism/cheating/${id}/appeal`, data);
    return res.data;
  },
};

export const problemSetApi = {
  create: async (data: Partial<ProblemSet>) => {
    const res = await api.post<ApiResponse<ProblemSet>>('/problem-sets', data);
    return res.data;
  },

  list: async (params?: {
    page?: number;
    limit?: number;
    category?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'SPECIAL_TOPIC' | 'INTERVIEW_PREP' | 'CONTEST';
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
    search?: string;
    isFeatured?: boolean;
    createdBy?: string;
  }) => {
    const res = await api.get<PaginatedResponse<ProblemSet>>('/problem-sets', { params });
    return res.data;
  },

  getBySlug: async (slug: string) => {
    const res = await api.get<ApiResponse<ProblemSet>>(`/problem-sets/${slug}`);
    return res.data;
  },

  update: async (id: string, data: Partial<ProblemSet>) => {
    const res = await api.put<ApiResponse<ProblemSet>>(`/problem-sets/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/problem-sets/${id}`);
    return res.data;
  },

  addProblem: async (id: string, data: {
    problemId: string;
    section?: string;
    points?: number;
    isRequired?: boolean;
    notes?: string;
  }) => {
    const res = await api.post<ApiResponse<any>>(`/problem-sets/${id}/problems`, data);
    return res.data;
  },

  removeProblem: async (id: string, problemId: string) => {
    const res = await api.delete<ApiResponse<null>>(`/problem-sets/${id}/problems/${problemId}`);
    return res.data;
  },

  updateProblem: async (id: string, problemId: string, data: any) => {
    const res = await api.put<ApiResponse<any>>(`/problem-sets/${id}/problems/${problemId}`, data);
    return res.data;
  },

  enroll: async (id: string) => {
    const res = await api.post<ApiResponse<ProblemSetProgress>>(`/problem-sets/${id}/enroll`);
    return res.data;
  },

  rate: async (id: string, data: { rating: number; comment?: string }) => {
    const res = await api.post<ApiResponse<any>>(`/problem-sets/${id}/rate`, data);
    return res.data;
  },

  getRecommended: async (limit?: number) => {
    const res = await api.get<ApiResponse<ProblemSet[]>>('/problem-sets/recommended', { params: { limit } });
    return res.data;
  },

  getMyProgress: async (params?: {
    status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    limit?: number;
  }) => {
    const res = await api.get<ApiResponse<ProblemSetProgress[]>>('/problem-sets/me/progress', { params });
    return res.data;
  },
};

export const hintApi = {
  getHints: async (problemId: string) => {
    const res = await api.get<ApiResponse<ProblemHint[]>>(`/hints/problems/${problemId}/hints`);
    return res.data;
  },

  createHint: async (problemId: string, data: Partial<ProblemHint>) => {
    const res = await api.post<ApiResponse<ProblemHint>>(`/hints/problems/${problemId}/hints`, data);
    return res.data;
  },

  updateHint: async (id: string, data: Partial<ProblemHint>) => {
    const res = await api.put<ApiResponse<ProblemHint>>(`/hints/hints/${id}`, data);
    return res.data;
  },

  deleteHint: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/hints/hints/${id}`);
    return res.data;
  },

  unlockHint: async (id: string) => {
    const res = await api.post<ApiResponse<{ unlocked: boolean; hint?: ProblemHint; requiredAttempts?: number; currentAttempts?: number }>>(`/hints/hints/${id}/unlock`);
    return res.data;
  },

  getMyWeakTags: async (limit?: number) => {
    const res = await api.get<ApiResponse<UserWeakTag[]>>('/hints/me/weak-tags', { params: { limit } });
    return res.data;
  },

  analyzeWeakTags: async () => {
    const res = await api.post<ApiResponse<UserWeakTag[]>>('/hints/me/analyze-weak-tags');
    return res.data;
  },

  getLearningPath: async () => {
    const res = await api.get<ApiResponse<LearningPathRecommendation>>('/hints/me/learning-path');
    return res.data;
  },

  getRelatedProblems: async (problemId: string, limit?: number) => {
    const res = await api.get<ApiResponse<Problem[]>>(`/hints/problems/${problemId}/related`, { params: { limit } });
    return res.data;
  },
};

export const judgeAdminApi = {
  rejudgeSubmission: async (id: string) => {
    const res = await api.post<ApiResponse<any>>(`/judge-admin/submissions/${id}/rejudge`);
    return res.data;
  },

  rejudgeProblem: async (problemId: string) => {
    const res = await api.post<ApiResponse<any>>(`/judge-admin/problems/${problemId}/rejudge`);
    return res.data;
  },

  rejudgeContest: async (contestId: string) => {
    const res = await api.post<ApiResponse<any>>(`/judge-admin/contests/${contestId}/rejudge`);
    return res.data;
  },

  rejudgeSelected: async (submissionIds: string[]) => {
    const res = await api.post<ApiResponse<any>>('/judge-admin/submissions/rejudge', { submissionIds });
    return res.data;
  },

  registerJudgeNode: async (data: Partial<JudgeNode>) => {
    const res = await api.post<ApiResponse<JudgeNode>>('/judge-admin/judge-nodes', data);
    return res.data;
  },

  listJudgeNodes: async (params?: {
    status?: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTENANCE' | 'ERROR';
    type?: 'STANDARD' | 'SPECIAL' | 'INTERACTIVE' | 'UNIVERSAL';
    isEnabled?: boolean;
  }) => {
    const res = await api.get<ApiResponse<JudgeNode[]>>('/judge-admin/judge-nodes', { params });
    return res.data;
  },

  updateJudgeNode: async (id: string, data: Partial<JudgeNode>) => {
    const res = await api.put<ApiResponse<JudgeNode>>(`/judge-admin/judge-nodes/${id}`, data);
    return res.data;
  },

  deleteJudgeNode: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/judge-admin/judge-nodes/${id}`);
    return res.data;
  },

  getQueueStatus: async () => {
    const res = await api.get<ApiResponse<JudgeQueueStatus>>('/judge-admin/queue/status');
    return res.data;
  },

  pauseQueue: async () => {
    const res = await api.post<ApiResponse<{ paused: boolean }>>('/judge-admin/queue/pause');
    return res.data;
  },

  resumeQueue: async () => {
    const res = await api.post<ApiResponse<{ paused: boolean }>>('/judge-admin/queue/resume');
    return res.data;
  },

  emptyQueue: async () => {
    const res = await api.post<ApiResponse<{ emptied: boolean }>>('/judge-admin/queue/empty');
    return res.data;
  },
};

export default api;
