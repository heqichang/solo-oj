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

export type PlagiarismReportType = 'PROBLEM' | 'CONTEST' | 'MANUAL';
export type PlagiarismReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PlagiarismAlgorithm = 'TOKEN_SIMILARITY' | 'AST_SIMILARITY' | 'MOSS' | 'SIMIAN';
export type PlagiarismMatchStatus = 'PENDING_REVIEW' | 'REVIEWED' | 'CONFIRMED_CHEATING' | 'FALSE_POSITIVE';
export type CheatingType = 'PLAGIARISM' | 'COLLUSION' | 'MULTIPLE_ACCOUNTS' | 'IP_SHARING' | 'OTHER';
export type CheatingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PunishmentType = 'WARNING' | 'SCORE_CANCELLATION' | 'CONTEST_DISQUALIFICATION' | 'TEMPORARY_BAN' | 'PERMANENT_BAN';
export type AppealDecision = 'UPHELD' | 'OVERTURNED' | 'REDUCED';

export interface PlagiarismReport {
  id: string;
  problemId?: string;
  contestId?: string;
  type: PlagiarismReportType;
  status: PlagiarismReportStatus;
  totalSubmissions: number;
  suspiciousPairs: number;
  algorithm: PlagiarismAlgorithm;
  threshold: number;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  generatedBy?: string;
  generator?: User;
  problem?: Problem;
  contest?: Contest;
  matches?: PlagiarismMatch[];
  createdAt: string;
  updatedAt: string;
}

export interface PlagiarismMatch {
  id: string;
  reportId: string;
  submissionId1: string;
  submissionId2: string;
  userId1: string;
  userId2: string;
  similarityScore: number;
  tokenSimilarity: number;
  structureSimilarity: number;
  variableSimilarity: number;
  matchedLines1: number[];
  matchedLines2: number[];
  highlightedCode1?: string;
  highlightedCode2?: string;
  status: PlagiarismMatchStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  report?: PlagiarismReport;
  user1?: User;
  user2?: User;
  submission1?: Submission;
  submission2?: Submission;
  createdAt: string;
  updatedAt: string;
}

export interface CheatingRecord {
  id: string;
  userId: string;
  contestId?: string;
  submissionId?: string;
  plagiarismMatchId?: string;
  type: CheatingType;
  severity: CheatingSeverity;
  punishment: PunishmentType;
  description?: string;
  evidence: Record<string, any>;
  punishmentStartDate?: string;
  punishmentEndDate?: string;
  isActive: boolean;
  appealed: boolean;
  appealComment?: string;
  appealReviewed: boolean;
  appealReviewedBy?: string;
  appealDecision?: AppealDecision;
  createdBy: string;
  user?: User;
  creator?: User;
  contest?: Contest;
  submission?: Submission;
  plagiarismMatch?: PlagiarismMatch;
  createdAt: string;
  updatedAt: string;
}

export type JudgeNodeStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'MAINTENANCE' | 'ERROR';
export type JudgeNodeType = 'STANDARD' | 'SPECIAL' | 'INTERACTIVE' | 'UNIVERSAL';
export type ProblemJudgeType = 'STANDARD' | 'SPECIAL_JUDGE' | 'INTERACTIVE' | 'OUTPUT_ONLY';

export interface JudgeNode {
  id: string;
  name: string;
  endpoint: string;
  token?: string;
  status: JudgeNodeStatus;
  type: JudgeNodeType;
  supportedLanguages: string[];
  maxConcurrentJobs: number;
  currentJobs: number;
  totalJobsProcessed: number;
  totalErrors: number;
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  diskUsage: number;
  lastHeartbeat?: string;
  lastError?: string;
  lastErrorAt?: string;
  version?: string;
  region?: string;
  priority: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JudgeQueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export type ProblemSetCategory = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'SPECIAL_TOPIC' | 'INTERVIEW_PREP' | 'CONTEST';
export type ProblemSetDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
export type ProblemSetStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface ProblemSet {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: ProblemSetCategory;
  difficulty: ProblemSetDifficulty;
  tags: string[];
  coverImage?: string;
  isPublic: boolean;
  isFeatured: boolean;
  problemCount: number;
  totalEnrolled: number;
  totalCompleted: number;
  averageRating: number;
  ratingCount: number;
  estimatedTime: number;
  prerequisites: any[];
  learningObjectives: any[];
  createdBy: string;
  creator?: User;
  problems?: ProblemSetProblem[];
  progress?: ProblemSetProgress;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSetProblem {
  id: string;
  problemSetId: string;
  problemId: string;
  position: number;
  section?: string;
  points: number;
  isRequired: boolean;
  notes?: string;
  problem?: Problem;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSetProgress {
  id: string;
  problemSetId: string;
  userId: string;
  status: ProblemSetStatus;
  totalProblems: number;
  solvedProblems: number;
  attemptedProblems: number;
  progressPercentage: number;
  totalPoints: number;
  earnedPoints: number;
  problemStatuses: Record<string, string>;
  lastProblemId?: string;
  startedAt?: string;
  completedAt?: string;
  lastActivityAt?: string;
  totalTimeSpent: number;
  problemSet?: ProblemSet;
  createdAt: string;
  updatedAt: string;
}

export interface ProblemSetRating {
  id: string;
  problemSetId: string;
  userId: string;
  rating: number;
  comment?: string;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export type HintType = 'DIRECTIONAL' | 'APPROACH' | 'CODE_SNIPPET' | 'FULL_SOLUTION';
export type WeakTagLevel = 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_WEAK';

export interface ProblemHint {
  id: string;
  problemId: string;
  level: number;
  type: HintType;
  title?: string;
  content: string;
  language?: string;
  isFree: boolean;
  requiredAttempts: number;
  pointsCost: number;
  createdBy?: string;
  canAccess?: boolean;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWeakTag {
  id: string;
  userId: string;
  tagId: string;
  tagName: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  averageTimeSpent: number;
  weaknessScore: number;
  level: WeakTagLevel;
  lastPracticed?: string;
  recommendations: Array<{
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface LearningPathRecommendation {
  weakAreas: UserWeakTag[];
  strongAreas: UserWeakTag[];
  recommendedLevel: string;
  recommendedSets: ProblemSet[];
  nextTopics: Array<{
    tagName: string;
    recommendations: Array<{
      id: string;
      title: string;
      slug: string;
      difficulty: string;
    }>;
  }>;
}

export interface Subtask {
  id: string;
  name: string;
  score: number;
  testCases: number[];
  description?: string;
}

export interface SubtaskScore {
  subtaskId: string;
  subtaskName: string;
  score: number;
  maxScore: number;
  passed: number;
  total: number;
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
