import admin from "../config/firebase.js";
import User from "../models/User.js";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/email.js";

/**
 * REGISTER
 */
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Check duplicates in MongoDB
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    // Create user in Firebase
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
      });
    } catch (err) {
      if (err.code === "auth/email-already-exists") {
        return res.status(400).json({
          message: "Email already registered",
        });
      }
      return res.status(500).json({
        message: "Registration failed. Please try again.",
      });
    }

    // Create user in MongoDB
    let newUser;
    try {
      newUser = await User.create({
        firebaseUid: firebaseUser.uid,
        email,
        username,
        displayName: username,
        emailVerified: false,
        avatar: "default-avatar.png",
        role: "user",
        tokensBalance: 0,
        isBanned: false,
        lastLogin: new Date(),
      });
    } catch (mongoError) {
      await admin.auth().deleteUser(firebaseUser.uid);
      return res.status(500).json({
        message: "Registration failed. Please try again.",
      });
    }

    // Send verification email
    try {
      const link = await admin.auth().generateEmailVerificationLink(email);
      await sendVerificationEmail(email, link);
    } catch (emailErr) {
      console.log("Verification email failed:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        emailVerified: newUser.emailVerified,
      },
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
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const mongoUser = await User.findOne({ email });

    let firebaseUser = null;
    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
    } catch {
      firebaseUser = null;
    }

    if (mongoUser && !firebaseUser) {
      return res.status(409).json({
        message: "Account error. Please contact support.",
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
          message: "Too many failed attempts. Please try again later.",
        });
      }
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const decodedToken = await admin.auth().verifyIdToken(data.idToken);

    if (!decodedToken.email_verified) {
      try {
        const link = await admin.auth().generateEmailVerificationLink(email);
        await sendVerificationEmail(email, link);
      } catch {
        console.log("Verification email resend failed");
      }

      return res.status(403).json({
        message:
          "Please verify your email before logging in. A new verification link has been sent.",
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firebaseUid: data.localId,
        email,
        username: email.split("@")[0],
        displayName: email.split("@")[0],
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
        message: "Your account has been suspended",
      });
    }

    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await admin
      .auth()
      .createSessionCookie(data.idToken, { expiresIn });

    res.cookie("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: expiresIn,
    });

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        tokensBalance: user.tokensBalance,
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
      } catch {}
    }

    res.clearCookie("session");
    res.json({ success: true, message: "Logged out successfully" });
  } catch {
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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);
    await sendPasswordResetEmail(email, resetLink, user.username);

    res.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
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
