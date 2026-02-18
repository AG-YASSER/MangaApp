import admin from "../config/firebase.js";
import User from "../models/User.js";
import TempRegistration from "../models/TempRegistration.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/email.js";
import crypto from 'crypto';

export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already taken",
      });
    }

    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    } catch (error) {}

    const existingTemp = await TempRegistration.findOne({ email });
    if (existingTemp) {
      await TempRegistration.deleteOne({ email });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

    await TempRegistration.create({
      email,
      password,
      username,
      verificationToken,
      tokenExpiry,
    });

    const verificationLink = `http://localhost:5000/api/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
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

export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification link",
      });
    }

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

    await TempRegistration.deleteOne({ _id: tempReg._id });

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
    
    return res.status(500).json({
      success: false,
      message: "Verification failed. Please try again.",
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    try {
      await admin.auth().getUserByEmail(email);
      return res.status(400).json({
        success: false,
        message: "This email is already registered. Please login instead.",
      });
    } catch {}

    const tempReg = await TempRegistration.findOne({ email });
    
    if (!tempReg) {
      return res.status(400).json({
        success: false,
        message: "No pending registration found for this email. Please register again.",
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    tempReg.verificationToken = verificationToken;
    tempReg.tokenExpiry = tokenExpiry;
    await tempReg.save();

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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

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

    const decodedToken = await admin.auth().verifyIdToken(data.idToken);

    if (!decodedToken.email_verified) {
      const link = await admin.auth().generateEmailVerificationLink(email);
      await sendVerificationEmail(email, link, decodedToken.displayName || email.split('@')[0]);
      
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. A new verification link has been sent.",
        emailVerified: false,
      });
    }

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