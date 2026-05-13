const Queue = require('bull');
const { REDIS } = require('./constants');

const judgeQueue = new Queue('judge-queue', {
  redis: {
    host: REDIS.host,
    port: REDIS.port,
  },
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

module.exports = { judgeQueue };
