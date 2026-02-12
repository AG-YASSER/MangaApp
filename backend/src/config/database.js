import dns from "node:dns/promises";
import mongoose from "mongoose";

dns.setServers(["1.1.1.1"]); 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  }
  catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  } 
};

export default connectDB;
