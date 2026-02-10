import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoutes from './routes/userRoutes.js';


dotenv.config();
const server = express();
const PORT = process.env.PORT || 3000; 

// Middleware
server.use(express.json());

// 3. Use routes
server.use('/api/users', userRoutes);

// Start Server only after DB connection
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();