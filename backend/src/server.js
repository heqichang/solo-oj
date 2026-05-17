require('dotenv').config();

const http = require('http');
const app = require('./app');
const { PORT } = require('./config/constants');
const { connectDatabase } = require('./config/database');
const { setupWebSocket } = require('./config/websocket');

const startServer = async () => {
  await connectDatabase();
  
  const server = http.createServer(app);
  
  setupWebSocket(server);
  
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`WebSocket enabled`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
