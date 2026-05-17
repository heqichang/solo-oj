require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'solo_oj',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  
  REDIS: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  
  JWT: {
    secret: process.env.JWT_SECRET || 'solo-oj-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  SANDBOX: {
    memoryLimitMB: parseInt(process.env.SANDBOX_MEMORY_LIMIT_MB) || 256,
    cpuLimit: parseFloat(process.env.SANDBOX_CPU_LIMIT) || 0.5,
    timeoutMs: parseInt(process.env.SANDBOX_TIMEOUT_MS) || 5000,
  },
  
  PATHS: {
    testData: process.env.TEST_DATA_PATH || './test-data',
    upload: process.env.UPLOAD_PATH || './uploads',
  },
  
  JUDGE_STATUS: {
    PENDING: 'PENDING',
    RUNNING: 'RUNNING',
    ACCEPTED: 'ACCEPTED',
    WRONG_ANSWER: 'WRONG_ANSWER',
    TIME_LIMIT_EXCEEDED: 'TIME_LIMIT_EXCEEDED',
    MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
    RUNTIME_ERROR: 'RUNTIME_ERROR',
    COMPILATION_ERROR: 'COMPILATION_ERROR',
    SYSTEM_ERROR: 'SYSTEM_ERROR',
  },

  CONTEST_RULES: {
    ACM: 'ACM',
    OI: 'OI',
    IOI: 'IOI',
  },

  CONTEST_STATUS: {
    UPCOMING: 'UPCOMING',
    RUNNING: 'RUNNING',
    ENDED: 'ENDED',
  },

  PROBLEM_STATUS: {
    DRAFT: 'DRAFT',
    PENDING_REVIEW: 'PENDING_REVIEW',
    PUBLISHED: 'PUBLISHED',
    REJECTED: 'REJECTED',
  },

  DISCUSSION_SORT: {
    LATEST: 'LATEST',
    HOTTEST: 'HOTTEST',
  },

  ACM_PENALTY: 20,

  PLAGIARISM_REPORT_TYPE: {
    PROBLEM: 'PROBLEM',
    CONTEST: 'CONTEST',
    MANUAL: 'MANUAL',
  },

  PLAGIARISM_REPORT_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },

  PLAGIARISM_ALGORITHM: {
    TOKEN_SIMILARITY: 'TOKEN_SIMILARITY',
    AST_SIMILARITY: 'AST_SIMILARITY',
    MOSS: 'MOSS',
    SIMIAN: 'SIMIAN',
  },

  PLAGIARISM_MATCH_STATUS: {
    PENDING_REVIEW: 'PENDING_REVIEW',
    REVIEWED: 'REVIEWED',
    CONFIRMED_CHEATING: 'CONFIRMED_CHEATING',
    FALSE_POSITIVE: 'FALSE_POSITIVE',
  },

  CHEATING_TYPE: {
    PLAGIARISM: 'PLAGIARISM',
    COLLUSION: 'COLLUSION',
    MULTIPLE_ACCOUNTS: 'MULTIPLE_ACCOUNTS',
    IP_SHARING: 'IP_SHARING',
    OTHER: 'OTHER',
  },

  CHEATING_SEVERITY: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  },

  PUNISHMENT_TYPE: {
    WARNING: 'WARNING',
    SCORE_CANCELLATION: 'SCORE_CANCELLATION',
    CONTEST_DISQUALIFICATION: 'CONTEST_DISQUALIFICATION',
    TEMPORARY_BAN: 'TEMPORARY_BAN',
    PERMANENT_BAN: 'PERMANENT_BAN',
  },

  APPEAL_DECISION: {
    UPHELD: 'UPHELD',
    OVERTURNED: 'OVERTURNED',
    REDUCED: 'REDUCED',
  },

  JUDGE_NODE_STATUS: {
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
    BUSY: 'BUSY',
    MAINTENANCE: 'MAINTENANCE',
    ERROR: 'ERROR',
  },

  JUDGE_NODE_TYPE: {
    STANDARD: 'STANDARD',
    SPECIAL: 'SPECIAL',
    INTERACTIVE: 'INTERACTIVE',
    UNIVERSAL: 'UNIVERSAL',
  },

  PROBLEM_JUDGE_TYPE: {
    STANDARD: 'STANDARD',
    SPECIAL_JUDGE: 'SPECIAL_JUDGE',
    INTERACTIVE: 'INTERACTIVE',
    OUTPUT_ONLY: 'OUTPUT_ONLY',
  },

  PROBLEM_SET_CATEGORY: {
    BEGINNER: 'BEGINNER',
    INTERMEDIATE: 'INTERMEDIATE',
    ADVANCED: 'ADVANCED',
    SPECIAL_TOPIC: 'SPECIAL_TOPIC',
    INTERVIEW_PREP: 'INTERVIEW_PREP',
    CONTEST: 'CONTEST',
  },

  PROBLEM_SET_DIFFICULTY: {
    EASY: 'EASY',
    MEDIUM: 'MEDIUM',
    HARD: 'HARD',
    MIXED: 'MIXED',
  },

  PROBLEM_SET_STATUS: {
    NOT_STARTED: 'NOT_STARTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
  },

  HINT_TYPE: {
    DIRECTIONAL: 'DIRECTIONAL',
    APPROACH: 'APPROACH',
    CODE_SNIPPET: 'CODE_SNIPPET',
    FULL_SOLUTION: 'FULL_SOLUTION',
  },

  WEAK_TAG_LEVEL: {
    STRONG: 'STRONG',
    MODERATE: 'MODERATE',
    WEAK: 'WEAK',
    VERY_WEAK: 'VERY_WEAK',
  },

  SUBMISSION_PRIORITY: {
    LOW: 1,
    NORMAL: 5,
    HIGH: 10,
    CONTEST: 15,
    REJUDGE: 3,
  },

  RISK_LEVEL: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
  },

  LANGUAGES: {
    cpp: {
      name: 'C++',
      extension: '.cpp',
      compileCommand: 'g++',
      compileArgs: ['-O2', '-std=c++17', '-o', 'main', 'main.cpp'],
      runCommand: './main',
      dockerImage: 'gcc:13',
    },
    c: {
      name: 'C',
      extension: '.c',
      compileCommand: 'gcc',
      compileArgs: ['-O2', '-o', 'main', 'main.c'],
      runCommand: './main',
      dockerImage: 'gcc:13',
    },
    java: {
      name: 'Java',
      extension: '.java',
      compileCommand: 'javac',
      compileArgs: ['Main.java'],
      runCommand: 'java',
      runArgs: ['Main'],
      dockerImage: 'eclipse-temurin:17-jdk',
    },
    python: {
      name: 'Python',
      extension: '.py',
      compileCommand: null,
      runCommand: 'python3',
      runArgs: ['main.py'],
      dockerImage: 'python:3.11-slim',
    },
    javascript: {
      name: 'JavaScript',
      extension: '.js',
      compileCommand: null,
      runCommand: 'node',
      runArgs: ['main.js'],
      dockerImage: 'node:20',
    },
  },
};
