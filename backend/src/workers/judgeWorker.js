require('dotenv').config();

const { judgeQueue } = require('../config/redis');
const { judge } = require('../services/judgeService');
const { connectDatabase } = require('../config/database');
const { processContestSubmission } = require('../services/contestService');
const { recordSubmissionInStats } = require('../services/rankingService');
const {
  Submission,
  Problem,
  User,
  Contest,
  ContestProblem,
} = require('../models');

const processJudgeJob = async (job) => {
  const {
    submissionId,
    problemId,
    language,
    code,
    timeLimitMs,
    memoryLimitMB,
    contestId,
    contestProblemId,
  } = job.data;
  
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
    
    await recordSubmissionInStats(submission.userId, submission, false);
    
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
            await recordSubmissionInStats(userId, submission, true);
          }
        }
      }
    }
    
    if (contestId && contestProblemId) {
      const contest = await Contest.findByPk(contestId);
      const contestProblem = await ContestProblem.findByPk(contestProblemId);
      
      if (contest && contestProblem) {
        const isAccepted = result.status === 'ACCEPTED';
        let score = 0;
        
        if (contest.ruleType === 'ACM') {
          score = isAccepted ? 1 : 0;
        } else {
          if (contestProblem.score > 0 && result.totalTestCases > 0) {
            score = Math.round((result.passedTestCases / result.totalTestCases) * contestProblem.score);
          }
        }
        
        await processContestSubmission(
          contest,
          contestProblem,
          submission,
          isAccepted,
          score
        );
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
