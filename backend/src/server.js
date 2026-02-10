import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";


dotenv.config();
const server = express();
const PORT = process.env.PORT || 3000; 

// Middleware
server.use(express.json());

// Routes
server.get("/", (req, res) => {
  res.send("Hello from backend!");
});

server.get("/", (req, res) => {
  res.send("Hello from the backend!");
});

// Start Server only after DB connection
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();