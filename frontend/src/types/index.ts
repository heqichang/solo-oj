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

export type ProblemStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED';

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
  status: ProblemStatus;
  reviewComment?: string;
  createdBy?: string;
  reviewedBy?: string;
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
  contestSubmission?: ContestSubmission;
  createdAt: string;
  updatedAt: string;
}

export type ContestRuleType = 'ACM' | 'OI' | 'IOI';
export type ContestStatusType = 'UPCOMING' | 'RUNNING' | 'ENDED';

export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  ruleType: ContestRuleType;
  startTime: string;
  endTime: string;
  freezeTime?: string;
  isFrozen: boolean;
  isVisible: boolean;
  problems: ContestProblem[];
  participants: ContestParticipant[];
  participantCount: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContestProblem {
  id: string;
  contestId: string;
  problemId: string;
  index: string;
  score: number;
  problem?: Problem;
  submissionsCount?: number;
  acceptedCount?: number;
}

export interface ContestParticipant {
  id: string;
  contestId: string;
  userId: string;
  user?: User;
  solvedCount: number;
  totalScore: number;
  penalty: number;
  rank: number;
  problemStats: Record<string, {
    solved: boolean;
    score: number;
    attempts: number;
    firstBlood: boolean;
    solveTimeMinutes?: number;
  }>;
  joinedAt: string;
}

export interface ContestSubmission {
  id: string;
  contestId: string;
  contestProblemId: string;
  userId: string;
  submissionId: string;
  submissionTimeMinutes: number;
  isFirstBlood: boolean;
  score: number;
  contestProblem?: ContestProblem;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  nickname: string;
  solvedCount: number;
  totalScore: number;
  penalty: number;
  problemStats: Record<string, {
    solved: boolean;
    score: number;
    attempts: number;
    firstBlood: boolean;
    solveTimeMinutes?: number;
    pending?: boolean;
  }>;
}

export interface GlobalRankingEntry {
  rank: number;
  userId: string;
  username: string;
  nickname: string;
  avatar: string | null;
  solvedCount: number;
  totalScore: number;
}

export interface UserStats {
  userId: string;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  totalSubmissions: number;
  tagStats: Array<{
    tagName: string;
    solved: number;
    total: number;
  }>;
  submissionHeatmap: Record<string, number>;
  recentSubmissions: Submission[];
}

export interface DiscussionPost {
  id: string;
  title: string;
  content: string;
  userId: string;
  problemId?: string;
  contestId?: string;
  isPinned: boolean;
  isLocked: boolean;
  likeCount: number;
  replyCount: number;
  isLiked?: boolean;
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
  };
  contest?: {
    id: string;
    slug: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionReply {
  id: string;
  content: string;
  userId: string;
  postId: string;
  parentId?: string;
  likeCount: number;
  isLiked?: boolean;
  user?: {
    id: string;
    username: string;
    nickname: string;
    avatar: string | null;
  };
  parentReply?: DiscussionReply;
  createdAt: string;
  updatedAt: string;
}

export interface CodeFavorite {
  id: string;
  userId: string;
  submissionId: string;
  note?: string;
  submission?: Submission;
  createdAt: string;
}

export interface CodeNote {
  id: string;
  userId: string;
  submissionId: string;
  content: string;
  startLine?: number;
  endLine?: number;
  submission?: Submission;
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
