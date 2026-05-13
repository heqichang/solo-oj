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
  
  LANGUAGES: {
    cpp: {
      name: 'C++',
      extension: '.cpp',
      compileCommand: 'g++',
      compileArgs: ['-O2', '-o', 'main', 'main.cpp'],
      runCommand: './main',
      dockerImage: 'gcc:13.2.0-alpine3.18',
    },
    c: {
      name: 'C',
      extension: '.c',
      compileCommand: 'gcc',
      compileArgs: ['-O2', '-o', 'main', 'main.c'],
      runCommand: './main',
      dockerImage: 'gcc:13.2.0-alpine3.18',
    },
    java: {
      name: 'Java',
      extension: '.java',
      compileCommand: 'javac',
      compileArgs: ['Main.java'],
      runCommand: 'java',
      runArgs: ['Main'],
      dockerImage: 'eclipse-temurin:17-jre-alpine',
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
      dockerImage: 'node:20-alpine',
    },
  },
};
