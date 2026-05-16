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

module.exports = { judgeQueue, redis };
