export interface User {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatar: string | null;
  bio: string;
  solvedCount: number;
  submissionsCount: number;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description: string;
}

export interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMs: number;
  memoryLimitMB: number;
  testCaseCount: number;
  submissionsCount: number;
  acceptedCount: number;
  acceptanceRate?: number;
  tags: Tag[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JudgeStatus = 
  | 'PENDING'
  | 'RUNNING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'SYSTEM_ERROR';

export interface TestResult {
  testCase: number;
  status: JudgeStatus;
  runtime: number;
  memory: number;
  passed: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
}

export interface Submission {
  id: string;
  code: string;
  language: 'cpp' | 'c' | 'java' | 'python' | 'javascript';
  status: JudgeStatus;
  runtimeMs: number | null;
  memoryMB: number | null;
  errorMessage: string | null;
  testResults: TestResult[];
  passedTestCases: number;
  totalTestCases: number;
  userId: string;
  problemId: string;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
  problem?: {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
