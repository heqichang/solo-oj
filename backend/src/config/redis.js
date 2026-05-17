const Queue = require('bull');
const Redis = require('ioredis');
const { REDIS } = require('./constants');

const redisOptions = {
  host: REDIS.host,
  port: REDIS.port,
};

const redis = new Redis(redisOptions);

const judgeQueue = new Queue('judge-queue', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

judgeQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

judgeQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed`);
});

judgeQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

const plagiarismQueue = new Queue('plagiarism-queue', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

plagiarismQueue.on('active', (job) => {
  console.log(`Plagiarism job ${job.id} started processing`);
});

plagiarismQueue.on('completed', (job, result) => {
  console.log(`Plagiarism job ${job.id} completed`);
});

plagiarismQueue.on('failed', (job, err) => {
  console.error(`Plagiarism job ${job.id} failed:`, err.message);
});

const notificationQueue = new Queue('notification-queue', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

module.exports = { judgeQueue, plagiarismQueue, notificationQueue, redis };
