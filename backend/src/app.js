const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const contestRoutes = require('./routes/contestRoutes');
const rankingRoutes = require('./routes/rankingRoutes');
const adminProblemRoutes = require('./routes/adminProblemRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const codeRoutes = require('./routes/codeRoutes');
const plagiarismRoutes = require('./routes/plagiarismRoutes');
const problemSetRoutes = require('./routes/problemSetRoutes');
const hintRoutes = require('./routes/hintRoutes');
const judgeAdminRoutes = require('./routes/judgeAdminRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/admin/problems', adminProblemRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/code', codeRoutes);
app.use('/api/plagiarism', plagiarismRoutes);
app.use('/api/problem-sets', problemSetRoutes);
app.use('/api/hints', hintRoutes);
app.use('/api/judge-admin', judgeAdminRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

module.exports = app;
