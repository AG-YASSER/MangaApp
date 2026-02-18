import admin from "../config/firebase.js";
import User from "../models/User.js";
import TempRegistration from "../models/TempRegistration.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../utils/email.js";
import crypto from 'crypto';

/**
 * REGISTER - Step 1: Send verification email, NO account created yet
 */
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check if username already exists in MongoDB
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    // Check if email already exists in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    } catch (error) {
      // Email doesn't exist in Firebase - good, continue
    }

    // Check if there's already a pending verification for this email
    const existingTemp = await TempRegistration.findOne({ email });
    if (existingTemp) {
      // Delete old temp registration
      await TempRegistration.deleteOne({ email });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 24 hours

    // Store in temporary registration
    await TempRegistration.create({
      email,
      password,
      username,
      verificationToken,
      tokenExpiry,
    });

    // Create verification link (using localhost for testing)
    const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // Send verification email
    await sendVerificationEmail(email, verificationLink, username);

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
      email: email,
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/**
 * VERIFY EMAIL - Step 2: Create account ONLY after email verification
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

    // Find temporary registration
    const tempReg = await TempRegistration.findOne({
      email,
      verificationToken: token,
      tokenExpiry: { $gt: new Date() }
    });

    if (!tempReg) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    // Create user in Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: tempReg.email,
        password: tempReg.password,
        emailVerified: true,
        displayName: tempReg.username,
      });
    } catch (firebaseError) {
      console.error("Firebase creation error:", firebaseError);
      
      if (firebaseError.code === 'auth/email-already-exists') {
        firebaseUser = await admin.auth().getUserByEmail(tempReg.email);
      } else {
        throw firebaseError;
      }
    }

    // Create user in MongoDB
    const newUser = await User.create({
      firebaseUid: firebaseUser.uid,
      email: tempReg.email,
      username: tempReg.username,
      displayName: tempReg.username,
      emailVerified: true,
      avatar: "default-avatar.png",
      role: "user",
      tokensBalance: 0,
      isBanned: false,
      lastLogin: new Date(),
    });

    // Delete temporary registration
    await TempRegistration.deleteOne({ _id: tempReg._id });

    // Send welcome email
    await sendWelcomeEmail(tempReg.email, tempReg.username);

    // ✅ RETURN JSON (NO REDIRECT)
    return res.status(200).json({
      success: true,
      message: "Email verified successfully! Account created.",
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
      }
    });

  } catch (error) {
    console.error("Email verification error:", error);
    
    // ✅ RETURN JSON ERROR (NO REDIRECT)
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

/**
 * RESEND VERIFICATION EMAIL
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Check if email already exists in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please login instead.",
      });
    } catch {
      // Email doesn't exist - good
    }

    // Find temporary registration
    const tempReg = await TempRegistration.findOne({ email });
    
    if (!tempReg) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email. Please register again.",
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update temp registration
    tempReg.verificationToken = verificationToken;
    tempReg.tokenExpiry = tokenExpiry;
    await tempReg.save();

    // Send new verification email
    const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, verificationLink, tempReg.username);

    res.json({
      success: true,
      message: "Verification email resent. Please check your inbox.",
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
};

/**
 * LOGIN - Only allow if email is verified
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Authenticate with Firebase
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.message === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        return res.status(429).json({
          success: false,
          message: "Too many failed attempts. Please try again later.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(data.idToken);

    // Check if email is verified
    if (!decodedToken.email_verified) {
      const link = await admin.auth().generateEmailVerificationLink(email);
      await sendVerificationEmail(email, link, decodedToken.displayName || email.split('@')[0]);
      
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. A new verification link has been sent.",
        emailVerified: false,
      });
    }

    // Find user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email,
        username: decodedToken.displayName || email.split("@")[0],
        displayName: decodedToken.displayName || email.split("@")[0],
        emailVerified: true,
        avatar: "default-avatar.png",
        role: "user",
        tokensBalance: 0,
        isBanned: false,
        lastLogin: new Date(),
      });
    }

    user.lastLogin = new Date();
    user.emailVerified = true;
    await user.save();

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended",
      });
    }

    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await admin.auth().createSessionCookie(data.idToken, { expiresIn });

    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: expiresIn,
    });

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        tokensBalance: user.tokensBalance,
        isLocked: user.isLocked || false,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * LOGOUT
 */
export const logout = async (req, res) => {
  try {
    const sessionCookie = req.cookies.session;

    if (sessionCookie) {
      try {
        const decoded = await admin.auth().verifySessionCookie(sessionCookie);
        await admin.auth().revokeRefreshTokens(decoded.uid);
      } catch (error) {
        console.log("Session revocation error:", error.message);
      }
    }

    res.clearCookie("session");
    res.json({ success: true, message: "Logged out successfully" });
    
  } catch (error) {
    console.error("Logout error:", error);
    res.clearCookie("session");
    res.json({ success: true, message: "Logged out successfully" });
  }
};

/**
 * FORGOT PASSWORD
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);
    
    const user = await User.findOne({ email });
    const username = user?.username || email.split('@')[0];
    
    try {
      await sendPasswordResetEmail(email, resetLink, username);
    } catch (emailError) {
      console.log("Password reset email failed:", emailError.message);
    }

    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link.",
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * CHANGE PASSWORD
 */
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const uid = req.user.uid;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    res.clearCookie("session");

    return res.json({
      success: true,
      message: "Password updated successfully. Please log in again.",
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password. Please try again.",
    });
  }
};