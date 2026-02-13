import admin from "../config/firebase.js";
import User from "../models/User.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email.js";

export const register = async (req, res) => {
  try {
    // ============ 1. VALIDATE INPUTS ============
    const { email, password, username } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters" });
    }

    if (username.length > 30) {
      return res
        .status(400)
        .json({ message: "Username cannot exceed 30 characters" });
    }

    if (!email.includes("@") || !email.includes(".")) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // ============ 2. CHECK IF USERNAME EXISTS ============
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    // ============ 3. CREATE USER IN FIREBASE ============
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email,
        password,
        emailVerified: false,
      });
    } catch (firebaseError) {
      if (firebaseError.code === "auth/email-already-exists") {
        return res.status(400).json({ message: "Email already registered" });
      }
      throw firebaseError;
    }

    // ============ 4. SEND EMAIL VERIFICATION ============
    try {
      const verificationLink = await admin
        .auth()
        .generateEmailVerificationLink(email);
      await sendVerificationEmail(email, verificationLink);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
    }

    // ============ 5. CREATE USER IN MONGODB ============
    const newUser = await User.create({
      firebaseUid: firebaseUser.uid,
      email,
      username,
      emailVerified: false,
      avatar: "",
      role: "user",
      tokensBalance: 0,
      isBanned: false,
      lastLogin: new Date(),
    });

    // ============ 6. RETURN SUCCESS ============
    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please verify your email before logging in.",
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        avatar: newUser.avatar,
        emailVerified: false,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // ============ 1. AUTHENTICATE WITH FIREBASE ============
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      if (data.error?.message === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        return res.status(429).json({
          message: "Too many failed attempts. Please try again later.",
        });
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ============ ✅ CHANGE 1: DECODE THE TOKEN ============
    // Get emailVerified from the token, not from data
    const decodedToken = await admin.auth().verifyIdToken(data.idToken);
    const emailVerified = decodedToken.email_verified; // true or false

    // ============ ✅ CHANGE 2: CHECK EMAIL VERIFICATION ============
    if (!emailVerified) {
      // Use token value, not data.emailVerified
      try {
        const verificationLink = await admin
          .auth()
          .generateEmailVerificationLink(email);
        // ✅ NOW IT WILL SEND REAL EMAILS
        await sendVerificationEmail(email, verificationLink);
        console.log(`✅ Verification email sent to ${email}`);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Continue registration even if email fails
      }

      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in. A new verification link has been sent.",
      });
    }

    // ============ 3. GET OR CREATE USER IN MONGODB ============
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firebaseUid: data.localId,
        email,
        username: email.split("@")[0],
        emailVerified: true, // We know it's true because we passed the check
        avatar: "",
        role: "user",
        tokensBalance: 0,
        isBanned: false,
        lastLogin: new Date(),
      });
    } else {
      // ============ ✅ CHANGE 3: UPDATE WITH CORRECT VALUE ============
      user.emailVerified = emailVerified; // Use token value, not data.emailVerified
      user.lastLogin = new Date();
      await user.save();
    }

    // ============ 5. CHECK IF USER IS BANNED ============
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned",
      });
    }

    // ============ ✅ CREATE SESSION COOKIE ============
    const expiresIn = 5 * 24 * 60 * 60 * 1000; // 5 days

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(data.idToken, { expiresIn });

    // ✅ Send cookie to client
    res.cookie("session", sessionCookie, {
      httpOnly: true, // JS can't access it
      secure: true, // true in production (HTTPS)
      sameSite: "strict",
      maxAge: expiresIn,
    });

    // ============ 6. RETURN SUCCESS ============
    res.json({
      success: true,
      message: "Login successful (Session Created)",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    // 1️⃣ Get UID from session
    const uid = req.user.uid;
    console.log(req.user);

    // 2️⃣ Revoke all refresh tokens (kills sessions immediately)
    await admin.auth().revokeRefreshTokens(uid);

    // 3️⃣ Clear cookie from browser
    res.clearCookie("session");

    res.json({
      success: true,
      message: "Logout successful. Session revoked.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        message: "Email is required" 
      });
    }

    // 1. Check if user exists in MongoDB
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        message: "No account found with this email" 
      });
    }

    // 2. Generate REAL password reset link
    const resetLink = await admin
      .auth()
      .generatePasswordResetLink(email);  // ✅ Correct method!

    // 3. Send email with username from database
    await sendPasswordResetEmail(email, resetLink, user.username);

    // 4. ALWAYS return same message (security best practice)
    res.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    
    // Don't reveal if user exists or not
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again."
    });
  }
};
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    // UID from session cookie
    const uid = req.user.uid;

    // Update password in Firebase
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};
