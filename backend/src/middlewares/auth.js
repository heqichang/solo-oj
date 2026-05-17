const jwt = require('jsonwebtoken');
const { JWT } = require('../config/constants');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT.secret);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const authenticateOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT.secret);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });
    
    if (!user) {
      req.user = null;
      return next();
    }
    
    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { authenticate, authenticateOptional, requireAdmin };
