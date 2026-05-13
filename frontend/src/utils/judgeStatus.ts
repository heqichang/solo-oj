import type { JudgeStatus } from '../types';

export const STATUS_LABELS: Record<JudgeStatus, string> = {
  PENDING: '排队中',
  RUNNING: '评测中',
  ACCEPTED: '通过',
  WRONG_ANSWER: '答案错误',
  TIME_LIMIT_EXCEEDED: '超时',
  MEMORY_LIMIT_EXCEEDED: '内存超限',
  RUNTIME_ERROR: '运行时错误',
  COMPILATION_ERROR: '编译错误',
  SYSTEM_ERROR: '系统错误',
};

export const STATUS_COLORS: Record<JudgeStatus, string> = {
  PENDING: 'text-gray-500',
  RUNNING: 'text-blue-500',
  ACCEPTED: 'text-green-500',
  WRONG_ANSWER: 'text-red-500',
  TIME_LIMIT_EXCEEDED: 'text-purple-500',
  MEMORY_LIMIT_EXCEEDED: 'text-yellow-500',
  RUNTIME_ERROR: 'text-red-500',
  COMPILATION_ERROR: 'text-orange-500',
  SYSTEM_ERROR: 'text-gray-500',
};

export const STATUS_BG_COLORS: Record<JudgeStatus, string> = {
  PENDING: 'bg-gray-100',
  RUNNING: 'bg-blue-100',
  ACCEPTED: 'bg-green-100',
  WRONG_ANSWER: 'bg-red-100',
  TIME_LIMIT_EXCEEDED: 'bg-purple-100',
  MEMORY_LIMIT_EXCEEDED: 'bg-yellow-100',
  RUNTIME_ERROR: 'bg-red-100',
  COMPILATION_ERROR: 'bg-orange-100',
  SYSTEM_ERROR: 'bg-gray-100',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: '简单',
  MEDIUM: '中等',
  HARD: '困难',
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-green-500',
  MEDIUM: 'text-yellow-500',
  HARD: 'text-red-500',
};

export const DIFFICULTY_BG_COLORS: Record<string, string> = {
  EASY: 'bg-green-100',
  MEDIUM: 'bg-yellow-100',
  HARD: 'bg-red-100',
};

export const LANGUAGE_LABELS: Record<string, string> = {
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
};

export const MONACO_LANGUAGE_MAP: Record<string, string> = {
  cpp: 'cpp',
  c: 'c',
  java: 'java',
  python: 'python',
  javascript: 'javascript',
};
