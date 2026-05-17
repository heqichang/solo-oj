require('dotenv').config();

const { plagiarismQueue } = require('../config/redis');
const { processPlagiarismReport } = require('../services/plagiarismService');
const { connectDatabase } = require('../config/database');

const processPlagiarismJob = async (job) => {
  const { reportId } = job.data;
  
  console.log(`Processing plagiarism report ${reportId}...`);
  
  try {
    const result = await processPlagiarismReport(reportId);
    console.log(`Plagiarism report ${reportId} completed. Found ${result.matches.length} suspicious matches.`);
    return result;
  } catch (error) {
    console.error(`Error processing plagiarism report ${reportId}:`, error);
    throw error;
  }
};

const startWorker = async () => {
  await connectDatabase();
  
  console.log('Plagiarism worker started, waiting for jobs...');
  
  plagiarismQueue.process(processPlagiarismJob);
};

startWorker().catch((error) => {
  console.error('Failed to start plagiarism worker:', error);
  process.exit(1);
});
