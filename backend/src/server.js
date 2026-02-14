import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import authRoutes from './routes/authRoutes.js';
import userRoutes from "./routes/userRoutes.js";
import rateLimit from "express-rate-limit";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP
  message: "Too many requests from this IP, please try again later."
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

// Middleware
app.use(express.json());
app.use(globalLimiter);
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);

// Start Server only after DB connection
const startServer = async () => {
  await connectDB();

  app.listen(PORT,
    () => console.log(`Server running on port ${PORT}`)
  ); 
};

startServer();