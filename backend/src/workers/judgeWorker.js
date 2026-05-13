require('dotenv').config();

const { judgeQueue } = require('../config/redis');
const { judge } = require('../services/judgeService');
const { connectDatabase } = require('../config/database');
const { Submission, Problem, User } = require('../models');

const processJudgeJob = async (job) => {
  const { submissionId, problemId, language, code, timeLimitMs, memoryLimitMB } = job.data;
  
  console.log(`Processing submission ${submissionId}...`);
  
  let submission = null;
  
  try {
    submission = await Submission.findByPk(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    
    await submission.update({ status: 'RUNNING' });
    
    const result = await judge({
      language,
      code,
      problemId,
      timeLimitMs,
      memoryLimitMB,
    });
    
    const updateData = {
      status: result.status,
      testResults: result.testResults,
      passedTestCases: result.passedTestCases,
      totalTestCases: result.totalTestCases,
    };
    
    if (result.runtimeMs !== undefined) {
      updateData.runtimeMs = result.runtimeMs;
    }
    
    if (result.memoryMB !== undefined) {
      updateData.memoryMB = result.memoryMB;
    }
    
    if (result.error) {
      updateData.errorMessage = result.error;
    }
    
    await submission.update(updateData);
    
    if (result.status === 'ACCEPTED') {
      const problem = await Problem.findByPk(problemId);
      if (problem) {
        await problem.increment('acceptedCount');
      }
      
      const userId = submission.userId;
      if (userId) {
        const existingAccepted = await Submission.findOne({
          where: {
            userId,
            problemId,
            status: 'ACCEPTED',
          },
        });
        
        if (!existingAccepted) {
          const user = await User.findByPk(userId);
          if (user) {
            await user.increment('solvedCount');
          }
        }
      }
    }
    
    console.log(`Submission ${submissionId} completed with status: ${result.status}`);
    return result;
  } catch (error) {
    console.error(`Error processing submission ${submissionId}:`, error);
    
    if (submission) {
      await submission.update({
        status: 'SYSTEM_ERROR',
        errorMessage: error.message,
      });
    }
    
    throw error;
  }
};

const startWorker = async () => {
  await connectDatabase();
  
  console.log('Judge worker started, waiting for jobs...');
  
  judgeQueue.process(processJudgeJob);
};

startWorker().catch((error) => {
  console.error('Failed to start judge worker:', error);
  process.exit(1);
});
