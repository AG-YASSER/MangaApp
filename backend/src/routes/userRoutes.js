// userRoutes.js
import express from 'express';
import { createUser, getUsers } from '../controllers/userController.js';

const router = express.Router();

// POST /api/users
router.post('/', createUser);

// GET /api/users
router.get('/', getUsers);

export default router;