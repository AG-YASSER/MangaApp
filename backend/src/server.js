// src/server.js - CLEAN VERSION
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import './utils/cronJobs.js';

// Load env
dotenv.config();

// Import DB connection
import connectDB from "./config/database.js";

// Import routes
import routes from "./routes/index.js";

// Import middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ============ MIDDLEWARE (ORDER IS CRITICAL) ============

// 1. Basic middleware - these are safe
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 2. CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));

// 3. Security - with safe options
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 4. Compression
app.use(compression());

// 5. Logging
if (NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ============ NO SANITIZE MIDDLEWARE FOR NOW ============
// We'll add this back AFTER we confirm everything works

// ============ HEALTH CHECK (BEFORE ROUTES) ============
app.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Main server is working!",
    timestamp: new Date().toISOString() 
  });
});

// ============ ROUTES ============
app.use("/api", routes);

// ============ ERROR HANDLING ============
app.use(notFound);
app.use(errorHandler);

// ============ START SERVER ============
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();