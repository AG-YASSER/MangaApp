import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database.js";
import authRoutes from './routes/authRoute.js';
import cookieParser from "cookie-parser";



dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);


// Start Server only after DB connection
const startServer = async () => {
  await connectDB();

  app.listen(PORT,
    () => console.log(`Server running on port ${PORT}`)
  ); 
};

startServer();