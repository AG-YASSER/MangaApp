import admin from "../config/firebase.js";
import User from "../models/User.js";

/**
 * Authentication Middleware
 * Verifies session cookie and attaches user to request
 */
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
    
    const user = await User.findOne({ firebaseUid: decodedClaims.uid });
    
    if (user) {
      req.user.id = user._id;
      req.user.role = user.role;
      req.user.isBanned = user.isBanned;
      req.user.isLocked = user.isLocked || false;
      req.user.deleteRequestedAt = user.deleteRequestedAt;
      
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

/**
 * Require Unlocked Account Middleware
 * Blocks access if account is locked due to pending deletion
 */
export const requireUnlocked = (req, res, next) => {
  if (req.user?.isLocked) {
    return res.status(403).json({
      success: false,
      message: "Your account is locked due to pending deletion. Please cancel deletion first.",
      isLocked: true,
      deleteRequestedAt: req.user.deleteRequestedAt
    });
  }
  next();
};

/**
 * Role-Based Access Control Middleware
 * Restricts access to specific user roles
 * @param {Array} roles - Allowed roles (e.g., ['admin', 'mod'])
 */
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