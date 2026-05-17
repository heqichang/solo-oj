const crypto = require('crypto');
const { Op } = require('sequelize');
const {
  Submission,
  PlagiarismReport,
  PlagiarismMatch,
  CheatingRecord,
  User,
  Problem,
  Contest,
} = require('../models');
const { PLAGIARISM_REPORT_STATUS, PLAGIARISM_ALGORITHM, PLAGIARISM_MATCH_STATUS } = require('../config/constants');

const normalizeCode = (code, language) => {
  if (!code) return '';
  
  let normalized = code;
  
  normalized = normalized.replace(/\/\*[\s\S]*?\*\//g, ' ');
  normalized = normalized.replace(/\/\/.*$/gm, ' ');
  normalized = normalized.replace(/#.*$/gm, ' ');
  
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.trim();
  
  return normalized;
};

const tokenize = (code) => {
  const tokens = [];
  let i = 0;
  
  while (i < code.length) {
    const char = code[i];
    
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    if (/[a-zA-Z_$]/.test(char)) {
      let token = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        token += code[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: token });
      continue;
    }
    
    if (/[0-9]/.test(char)) {
      let token = '';
      while (i < code.length && /[0-9.]/.test(code[i])) {
        token += code[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: token });
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let token = quote;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\' && i + 1 < code.length) {
          token += code[i] + code[i + 1];
          i += 2;
        } else {
          token += code[i];
          i++;
        }
      }
      if (i < code.length) {
        token += code[i];
        i++;
      }
      tokens.push({ type: 'STRING', value: token });
      continue;
    }
    
    tokens.push({ type: 'OPERATOR', value: char });
    i++;
  }
  
  return tokens;
};

const normalizeIdentifiers = (tokens) => {
  const identifierMap = new Map();
  let counter = 0;
  
  return tokens.map(token => {
    if (token.type === 'IDENTIFIER') {
      const keywords = new Set([
        'int', 'char', 'float', 'double', 'void', 'bool', 'string',
        'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue',
        'return', 'class', 'struct', 'public', 'private', 'protected', 'static',
        'const', 'let', 'var', 'function', 'def', 'return', 'import', 'from', 'as',
        'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'extends',
        'interface', 'implements', 'package', 'import', 'true', 'false', 'null',
        'undefined', 'NaN', 'Infinity', 'typeof', 'instanceof', 'in', 'of',
        'async', 'await', 'yield', 'lambda', 'with', 'yield', 'delete', 'void'
      ]);
      
      if (keywords.has(token.value)) {
        return { ...token, normalized: token.value };
      }
      
      if (!identifierMap.has(token.value)) {
        identifierMap.set(token.value, `VAR_${counter++}`);
      }
      return { ...token, normalized: identifierMap.get(token.value) };
    }
    return { ...token, normalized: token.value };
  });
};

const getNormalizedSequence = (tokens) => {
  return tokens.map(t => t.normalized || t.value).join(' ');
};

const computeLevenshteinDistance = (s1, s2) => {
  const m = s1.length;
  const n = s2.length;
  
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  
  return dp[m][n];
};

const computeTokenSimilarity = (tokens1, tokens2) => {
  const seq1 = getNormalizedSequence(tokens1);
  const seq2 = getNormalizedSequence(tokens2);
  
  const maxLen = Math.max(seq1.length, seq2.length);
  if (maxLen === 0) return 1;
  
  const distance = computeLevenshteinDistance(seq1, seq2);
  return 1 - (distance / maxLen);
};

const computeStructureSimilarity = (tokens1, tokens2) => {
  const getStructureSequence = (tokens) => {
    return tokens
      .filter(t => t.type === 'OPERATOR' || 
        (t.type === 'IDENTIFIER' && ['if', 'else', 'for', 'while', 'do', 'switch', 'return', 'function', 'class'].includes(t.value)))
      .map(t => t.value)
      .join('');
  };
  
  const struct1 = getStructureSequence(tokens1);
  const struct2 = getStructureSequence(tokens2);
  
  const maxLen = Math.max(struct1.length, struct2.length);
  if (maxLen === 0) return 1;
  
  const distance = computeLevenshteinDistance(struct1, struct2);
  return 1 - (distance / maxLen);
};

const computeVariableSimilarity = (tokens1, tokens2) => {
  const getVariablePatterns = (tokens) => {
    const patterns = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].type === 'IDENTIFIER' && tokens[i + 1].type === 'OPERATOR') {
        patterns.push(`${tokens[i].normalized || tokens[i].value}_${tokens[i + 1].value}`);
      }
    }
    return patterns;
  };
  
  const patterns1 = new Set(getVariablePatterns(tokens1));
  const patterns2 = new Set(getVariablePatterns(tokens2));
  
  if (patterns1.size === 0 && patterns2.size === 0) return 1;
  
  const intersection = new Set([...patterns1].filter(x => patterns2.has(x)));
  const union = new Set([...patterns1, ...patterns2]);
  
  return intersection.size / union.size;
};

const findMatchedLines = (code1, code2, tokens1, tokens2) => {
  const lines1 = code1.split('\n');
  const lines2 = code2.split('\n');
  
  const lineTokens1 = lines1.map(line => tokenize(line));
  const lineTokens2 = lines2.map(line => tokenize(line));
  
  const matchedLines1 = [];
  const matchedLines2 = [];
  
  for (let i = 0; i < lineTokens1.length; i++) {
    for (let j = 0; j < lineTokens2.length; j++) {
      const norm1 = normalizeIdentifiers(lineTokens1[i]);
      const norm2 = normalizeIdentifiers(lineTokens2[j]);
      const similarity = computeTokenSimilarity(norm1, norm2);
      
      if (similarity > 0.85 && lineTokens1[i].length > 3) {
        matchedLines1.push(i + 1);
        matchedLines2.push(j + 1);
        break;
      }
    }
  }
  
  return {
    matchedLines1: [...new Set(matchedLines1)].sort((a, b) => a - b),
    matchedLines2: [...new Set(matchedLines2)].sort((a, b) => a - b),
  };
};

const highlightSimilarCode = (code, matchedLines) => {
  const lines = code.split('\n');
  const matchedSet = new Set(matchedLines);
  
  return lines.map((line, index) => {
    const lineNum = index + 1;
    if (matchedSet.has(lineNum)) {
      return `[HIGHLIGHT]${line}[/HIGHLIGHT]`;
    }
    return line;
  }).join('\n');
};

const computeSimilarity = (code1, code2, language1, language2) => {
  const normalized1 = normalizeCode(code1, language1);
  const normalized2 = normalizeCode(code2, language2);
  
  const tokens1 = tokenize(normalized1);
  const tokens2 = tokenize(normalized2);
  
  const normTokens1 = normalizeIdentifiers(tokens1);
  const normTokens2 = normalizeIdentifiers(tokens2);
  
  const tokenSimilarity = computeTokenSimilarity(normTokens1, normTokens2);
  const structureSimilarity = computeStructureSimilarity(normTokens1, normTokens2);
  const variableSimilarity = computeVariableSimilarity(normTokens1, normTokens2);
  
  const overallScore = (
    tokenSimilarity * 0.5 +
    structureSimilarity * 0.3 +
    variableSimilarity * 0.2
  );
  
  const { matchedLines1, matchedLines2 } = findMatchedLines(code1, code2, tokens1, tokens2);
  
  return {
    similarityScore: overallScore,
    tokenSimilarity,
    structureSimilarity,
    variableSimilarity,
    matchedLines1,
    matchedLines2,
    highlightedCode1: highlightSimilarCode(code1, matchedLines1),
    highlightedCode2: highlightSimilarCode(code2, matchedLines2),
  };
};

const createPlagiarismReport = async ({ problemId, contestId, type, algorithm, threshold, generatedBy }) => {
  const report = await PlagiarismReport.create({
    problemId,
    contestId,
    type,
    algorithm,
    threshold,
    generatedBy,
    status: PLAGIARISM_REPORT_STATUS.PENDING,
  });
  
  return report;
};

const processPlagiarismReport = async (reportId) => {
  const report = await PlagiarismReport.findByPk(reportId);
  if (!report) {
    throw new Error('Plagiarism report not found');
  }
  
  await report.update({
    status: PLAGIARISM_REPORT_STATUS.PROCESSING,
    startedAt: new Date(),
  });
  
  try {
    let submissions;
    
    if (report.contestId) {
      const { ContestSubmission } = require('../models');
      const contestSubmissions = await ContestSubmission.findAll({
        where: { contestId: report.contestId },
        include: [{
          model: Submission,
          as: 'submission',
          where: { status: 'ACCEPTED' },
        }],
      });
      submissions = contestSubmissions.map(cs => cs.submission);
    } else if (report.problemId) {
      submissions = await Submission.findAll({
        where: {
          problemId: report.problemId,
          status: 'ACCEPTED',
        },
      });
    } else {
      throw new Error('Either problemId or contestId must be provided');
    }
    
    submissions = submissions.filter(s => s && s.code);
    
    await report.update({ totalSubmissions: submissions.length });
    
    const matches = [];
    
    for (let i = 0; i < submissions.length; i++) {
      for (let j = i + 1; j < submissions.length; j++) {
        const sub1 = submissions[i];
        const sub2 = submissions[j];
        
        if (sub1.userId === sub2.userId) continue;
        
        const similarity = computeSimilarity(
          sub1.code,
          sub2.code,
          sub1.language,
          sub2.language
        );
        
        if (similarity.similarityScore >= report.threshold) {
          matches.push({
            reportId: report.id,
            submissionId1: sub1.id,
            submissionId2: sub2.id,
            userId1: sub1.userId,
            userId2: sub2.userId,
            similarityScore: similarity.similarityScore,
            tokenSimilarity: similarity.tokenSimilarity,
            structureSimilarity: similarity.structureSimilarity,
            variableSimilarity: similarity.variableSimilarity,
            matchedLines1: similarity.matchedLines1,
            matchedLines2: similarity.matchedLines2,
            highlightedCode1: similarity.highlightedCode1,
            highlightedCode2: similarity.highlightedCode2,
            status: PLAGIARISM_MATCH_STATUS.PENDING_REVIEW,
          });
        }
      }
    }
    
    if (matches.length > 0) {
      await PlagiarismMatch.bulkCreate(matches);
    }
    
    await report.update({
      status: PLAGIARISM_REPORT_STATUS.COMPLETED,
      suspiciousPairs: matches.length,
      completedAt: new Date(),
    });
    
    return { report, matches };
  } catch (error) {
    await report.update({
      status: PLAGIARISM_REPORT_STATUS.FAILED,
      errorMessage: error.message,
      completedAt: new Date(),
    });
    throw error;
  }
};

const getReportById = async (reportId) => {
  return await PlagiarismReport.findByPk(reportId, {
    include: [
      {
        model: PlagiarismMatch,
        as: 'matches',
        include: [
          { model: User, as: 'user1', attributes: ['id', 'username', 'nickname'] },
          { model: User, as: 'user2', attributes: ['id', 'username', 'nickname'] },
          { model: Submission, as: 'submission1', attributes: ['id', 'language', 'createdAt'] },
          { model: Submission, as: 'submission2', attributes: ['id', 'language', 'createdAt'] },
        ],
      },
      { model: Problem, as: 'problem', attributes: ['id', 'title', 'slug'] },
      { model: Contest, as: 'contest', attributes: ['id', 'title', 'slug'] },
      { model: User, as: 'generator', attributes: ['id', 'username', 'nickname'] },
    ],
  });
};

const getMatchById = async (matchId) => {
  return await PlagiarismMatch.findByPk(matchId, {
    include: [
      { model: PlagiarismReport, as: 'report' },
      { model: User, as: 'user1', attributes: ['id', 'username', 'nickname'] },
      { model: User, as: 'user2', attributes: ['id', 'username', 'nickname'] },
      { model: Submission, as: 'submission1', attributes: ['id', 'code', 'language', 'createdAt'] },
      { model: Submission, as: 'submission2', attributes: ['id', 'code', 'language', 'createdAt'] },
    ],
  });
};

const reviewMatch = async (matchId, status, reviewComment, reviewedBy) => {
  const match = await PlagiarismMatch.findByPk(matchId);
  if (!match) {
    throw new Error('Match not found');
  }
  
  await match.update({
    status,
    reviewComment,
    reviewedBy,
    reviewedAt: new Date(),
  });
  
  return match;
};

const checkIpSharing = async (userId, contestId, timeWindowHours = 24) => {
  const { SubmissionIpRecord } = require('../models');
  
  const timeWindow = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
  
  const userIps = await SubmissionIpRecord.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: timeWindow },
    },
    attributes: ['ipAddress'],
  });
  
  const ipAddresses = [...new Set(userIps.map(r => r.ipAddress))];
  
  const otherUsersWithSameIp = await SubmissionIpRecord.findAll({
    where: {
      ipAddress: { [Op.in]: ipAddresses },
      userId: { [Op.ne]: userId },
      createdAt: { [Op.gte]: timeWindow },
    },
    include: [{ model: User, as: 'user', attributes: ['id', 'username', 'nickname'] }],
    group: ['userId', 'ipAddress', 'user.id', 'user.username', 'user.nickname'],
  });
  
  return otherUsersWithSameIp.map(r => ({
    userId: r.userId,
    username: r.user?.username,
    ipAddress: r.ipAddress,
  }));
};

const detectSuspiciousActivity = async (userId, windowMinutes = 10, maxSubmissions = 20) => {
  const timeWindow = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  const recentSubmissions = await Submission.count({
    where: {
      userId,
      createdAt: { [Op.gte]: timeWindow },
    },
  });
  
  const ipSharingUsers = await checkIpSharing(userId, null, 24);
  
  const suspicious = [];
  
  if (recentSubmissions > maxSubmissions) {
    suspicious.push({
      type: 'RAPID_SUBMISSIONS',
      severity: 'MEDIUM',
      message: `User submitted ${recentSubmissions} times in ${windowMinutes} minutes (threshold: ${maxSubmissions})`,
    });
  }
  
  if (ipSharingUsers.length > 0) {
    suspicious.push({
      type: 'IP_SHARING',
      severity: 'HIGH',
      message: `User shares IP with ${ipSharingUsers.length} other users`,
      users: ipSharingUsers,
    });
  }
  
  return suspicious;
};

module.exports = {
  normalizeCode,
  tokenize,
  normalizeIdentifiers,
  computeSimilarity,
  createPlagiarismReport,
  processPlagiarismReport,
  getReportById,
  getMatchById,
  reviewMatch,
  checkIpSharing,
  detectSuspiciousActivity,
};
