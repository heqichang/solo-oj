const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { JWT } = require('../config/constants');
const { User } = require('../models');
const { success, error } = require('../utils/response');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: user.isAdmin },
    JWT.secret,
    { expiresIn: JWT.expiresIn }
  );
};

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });
    
    if (existingUser) {
      return error(res, 'Username or email already exists', 400);
    }
    
    const user = await User.create({
      username,
      email,
      password,
    });
    
    const token = generateToken(user);
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return success(res, {
      user: userResponse,
      token,
    }, 201);
  } catch (err) {
    console.error('Registration error:', err);
    return error(res, err.message || 'Failed to register user', 400);
  }
};

const login = async (req, res) => {
  try {
    const { login, password } = req.body;
    
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: login }, { email: login }],
      },
    });
    
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return error(res, 'Invalid credentials', 401);
    }
    
    const token = generateToken(user);
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return success(res, {
      user: userResponse,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Failed to login', 500);
  }
};

const getCurrentUser = async (req, res) => {
  try {
    return success(res, { user: req.user });
  } catch (err) {
    console.error('Get current user error:', err);
    return error(res, 'Failed to get user', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, bio, password } = req.body;
    const user = req.user;
    
    const updates = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    if (password) updates.password = password;
    
    await user.update(updates);
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return success(res, { user: userResponse });
  } catch (err) {
    console.error('Update profile error:', err);
    return error(res, 'Failed to update profile', 400);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
};
