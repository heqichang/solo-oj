require('dotenv').config();

const app = require('./app');
const { PORT } = require('./config/constants');
const { connectDatabase } = require('./config/database');

const startServer = async () => {
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
