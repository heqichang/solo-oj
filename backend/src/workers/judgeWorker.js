require('dotenv').config();

const { judgeQueue } = require('../config/redis');
const { judge } = require('../services/judgeService');
const { runSpecialJudge, gradeSubmissionWithSubtasks, validateOutputOnlySubmission } = require('../services/specialJudgeService');
const { connectDatabase } = require('../config/database');
const { processContestSubmission } = require('../services/contestService');
const { recordSubmissionInStats } = require('../services/rankingService');
const { updateProgress } = require('../services/problemSetService');
const {
  Submission,
  Problem,
  User,
  Contest,
  ContestProblem,
  ProblemSetProblem,
} = require('../models');
const { PROBLEM_JUDGE_TYPE, JUDGE_STATUS } = require('../config/constants');

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
    judgeType,
    specialJudgeCode,
    specialJudgeLanguage,
    specialJudgeTimeout,
    partialScoring,
    subtasks,
  } = job.data;
  
  console.log(`Processing submission ${submissionId} (type: ${judgeType || 'STANDARD'})...`);
  
  let submission = null;
  let problem = null;
  
  try {
    submission = await Submission.findByPk(submissionId);
    problem = await Problem.findByPk(problemId);
    
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found`);
    }
    
    await submission.update({ status: 'RUNNING' });
    
    let result;
    const actualJudgeType = judgeType || problem?.judgeType || PROBLEM_JUDGE_TYPE.STANDARD;
    
    if (actualJudgeType === PROBLEM_JUDGE_TYPE.OUTPUT_ONLY) {
      result = await validateOutputOnlySubmission(submission, problem);
    } else {
      result = await judge({
        language,
        code,
        problemId,
        timeLimitMs,
        memoryLimitMB,
      });
      
      if (actualJudgeType === PROBLEM_JUDGE_TYPE.SPECIAL_JUDGE && result.status === JUDGE_STATUS.SUCCESS) {
        const testCases = result.testResults || [];
        let totalScore = 0;
        
        for (let i = 0; i < testCases.length; i++) {
          const testResult = testCases[i];
          if (testResult.status === JUDGE_STATUS.ACCEPTED && specialJudgeCode) {
            const sjResult = await runSpecialJudge({
              judgeLanguage: specialJudgeLanguage,
              judgeCode: specialJudgeCode,
              input: testResult.input,
              expectedOutput: testResult.expectedOutput,
              actualOutput: testResult.actualOutput,
              timeLimitMs: specialJudgeTimeout || 10000,
              memoryLimitMB,
              problemId,
              submissionCode: code,
            });
            
            testResult.specialJudgeScore = sjResult.score;
            testResult.specialJudgeMessage = sjResult.message;
            totalScore += sjResult.score;
            
            if (sjResult.status !== JUDGE_STATUS.ACCEPTED) {
              testResult.status = JUDGE_STATUS.WRONG_ANSWER;
              testResult.passed = false;
            }
          }
        }
        
        const passedCount = testCases.filter(t => t.passed).length;
        result.status = passedCount === testCases.length ? JUDGE_STATUS.ACCEPTED : JUDGE_STATUS.WRONG_ANSWER;
        result.testResults = testCases;
        result.passedTestCases = passedCount;
        result.score = totalScore;
      }
    }
    
    if (partialScoring && subtasks && subtasks.length > 0) {
      const gradingResult = await gradeSubmissionWithSubtasks(
        { ...result, testResults: result.testResults || [] },
        { subtasks, partialScoring: true }
      );
      result.score = gradingResult.score;
      result.subtaskScores = gradingResult.subtaskScores;
    }
    
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
    
    if (result.score !== undefined) {
      updateData.score = result.score;
    }
    
    if (result.subtaskScores) {
      updateData.subtaskScores = result.subtaskScores;
    }
    
    await submission.update(updateData);
    
    await recordSubmissionInStats(submission.userId, submission, false);
    
    if (result.status === 'ACCEPTED') {
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
      
      const setProblems = await ProblemSetProblem.findAll({
        where: { problemId },
      });
      
      for (const sp of setProblems) {
        try {
          await updateProgress(sp.problemSetId, submission.userId, problemId, true);
        } catch (e) {
          console.error(`Error updating progress for set ${sp.problemSetId}:`, e.message);
        }
      }
    } else {
      const setProblems = await ProblemSetProblem.findAll({
        where: { problemId },
      });
      
      for (const sp of setProblems) {
        try {
          await updateProgress(sp.problemSetId, submission.userId, problemId, false);
        } catch (e) {
          console.error(`Error updating progress for set ${sp.problemSetId}:`, e.message);
        }
      }
    }
    
    if (contestId && contestProblemId) {
      const contest = await Contest.findByPk(contestId);
      const contestProblem = await ContestProblem.findByPk(contestProblemId);
      
      if (contest && contestProblem) {
        const isAccepted = result.status === 'ACCEPTED';
        let score = result.score || 0;
        
        if (score === 0 && isAccepted) {
          if (contest.ruleType === 'ACM') {
            score = 1;
          } else {
            if (contestProblem.score > 0 && result.totalTestCases > 0) {
              score = Math.round((result.passedTestCases / result.totalTestCases) * contestProblem.score);
            }
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
