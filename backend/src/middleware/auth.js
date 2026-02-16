// src/middleware/auth.js
import admin from "../config/firebase.js";
import User from "../models/User.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const sessionCookie = req.cookies.session;

    if (!sessionCookie) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    
    // Get user from database to add role and id
    const user = await User.findOne({ firebaseUid: decodedClaims.uid });
    
    if (user) {
      req.user.id = user._id;
      req.user.role = user.role;
      req.user.isBanned = user.isBanned;
      
      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({ 
          success: false, 
          message: "Your account has been suspended" 
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired session" 
    });
  }
};

export const roleMiddleware = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to access this resource" 
      });
    }

    next();
  };
};