const WebSocket = require('ws');
const { judgeQueue } = require('./redis');
const jwt = require('jsonwebtoken');
const { JWT } = require('./constants');

const wss = new WebSocket.Server({ noServer: true });

const clients = new Map();

const setupWebSocket = (server) => {
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    try {
      const decoded = jwt.verify(token, JWT.secret);
      request.userId = decoded.id;
      
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (error) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });
  
  wss.on('connection', (ws, request) => {
    const userId = request.userId;
    
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
    
    console.log(`Client connected: ${userId}, total: ${clients.get(userId).size}`);
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    });
    
    ws.on('close', () => {
      const userClients = clients.get(userId);
      if (userClients) {
        userClients.delete(ws);
        if (userClients.size === 0) {
          clients.delete(userId);
        }
      }
      console.log(`Client disconnected: ${userId}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  console.log('WebSocket server initialized');
};

const sendToUser = (userId, message) => {
  const userClients = clients.get(userId);
  if (!userClients) return;
  
  const messageStr = JSON.stringify(message);
  userClients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
};

const broadcast = (message) => {
  const messageStr = JSON.stringify(message);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
};

judgeQueue.on('completed', (job, result) => {
  const { submissionId, problemId, userId } = job.data;
  
  if (userId) {
    sendToUser(userId, {
      type: 'JUDGE_COMPLETED',
      submissionId,
      problemId,
      status: result.status,
      runtimeMs: result.runtimeMs,
      memoryMB: result.memoryMB,
      passedTestCases: result.passedTestCases,
      totalTestCases: result.totalTestCases,
      score: result.score,
      timestamp: Date.now(),
    });
  }
});

judgeQueue.on('failed', (job, err) => {
  const { submissionId, problemId, userId } = job.data;
  
  if (userId) {
    sendToUser(userId, {
      type: 'JUDGE_FAILED',
      submissionId,
      problemId,
      error: err.message,
      timestamp: Date.now(),
    });
  }
});

module.exports = {
  setupWebSocket,
  sendToUser,
  broadcast,
  wss,
};
