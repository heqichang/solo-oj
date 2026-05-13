const { Sequelize } = require('sequelize');
const { DB, NODE_ENV } = require('./constants');

const sequelize = new Sequelize(DB.database, DB.user, DB.password, {
  host: DB.host,
  port: DB.port,
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const connectDatabase = async (syncOptions = { alter: NODE_ENV === 'development' }) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    if (syncOptions !== null) {
      await sequelize.sync(syncOptions);
      console.log('Database models synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDatabase };
