const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  rejudgeSub,
  rejudgeProblem,
  rejudgeContest,
  rejudgeSelected,
  registerNode,
  heartbeat,
  listNodes,
  updateNode,
  deleteNode,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  emptyQueue,
} = require('../controllers/judgeAdminController');

router.post('/submissions/:id/rejudge', authenticate, requireAdmin, rejudgeSub);
router.post('/problems/:problemId/rejudge', authenticate, requireAdmin, rejudgeProblem);
router.post('/contests/:contestId/rejudge', authenticate, requireAdmin, rejudgeContest);
router.post('/submissions/rejudge', authenticate, requireAdmin, rejudgeSelected);

router.post('/judge-nodes', authenticate, requireAdmin, registerNode);
router.get('/judge-nodes', authenticate, requireAdmin, listNodes);
router.post('/judge-nodes/:id/heartbeat', heartbeat);
router.put('/judge-nodes/:id', authenticate, requireAdmin, updateNode);
router.delete('/judge-nodes/:id', authenticate, requireAdmin, deleteNode);

router.get('/queue/status', authenticate, requireAdmin, getQueueStatus);
router.post('/queue/pause', authenticate, requireAdmin, pauseQueue);
router.post('/queue/resume', authenticate, requireAdmin, resumeQueue);
router.post('/queue/empty', authenticate, requireAdmin, emptyQueue);

module.exports = router;
