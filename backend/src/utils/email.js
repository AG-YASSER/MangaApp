import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Manga App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", subject, "→", to);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    throw error;
  }
};

// ===============================
// ✅ Verification Email
// ===============================
export const sendVerificationEmail = (email, link) => {
  return sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: `
      <h1>Welcome!</h1>
      <p>Click below to verify your email:</p>
      <a href="${link}">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};

// ===============================
// ✅ Password Reset Email
// ===============================
export const sendPasswordResetEmail = (email, link, username) => {
  return sendEmail({
    to: email,
    subject: "Reset Your Password",
    html: `
      <h1>Hello ${username}</h1>
      <p>Click below to reset your password:</p>
      <a href="${link}">Reset Password</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
