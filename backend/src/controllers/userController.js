// userController.js
import User from '../models/User.js';

// CREATE USER
export const createUser = async (req, res) => {
  try {
    // req.body = data from Postman/Form
    const { username, email, password } = req.body;
    
    // 1. Create user using Model
    const user = await User.create({
      username,
      email,
      passwordHash: password // In real app, hash this
    });
    
    // 2. Send response
    res.status(201).json({
      success: true,
      data: user
    });
    
  } catch (error) {
    // 3. Handle errors
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// GET ALL USERS
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};