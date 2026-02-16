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
const logoUrl =
  "https://res.cloudinary.com/djxn01hgs/image/upload/v1771177370/logo_goadba.svg";
// Send a beautiful verification email with logo and modern style
export const sendVerificationEmail = (email, link) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Verify Your Account",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">[Man9a] Email Verification</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Dear User,<br><br>
        Please click the button below to verify your email address and activate your account.</p>
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#2563FF;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;margin:24px 0 16px 0;">Click Here</a>
        <p style="color:#888;font-size:13px;margin-top:24px;">This link expires in 24 hours.<br>If you did not create an account, you can ignore this email.</p>
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.<br>Address: Your Company Address Here</div>
      </div>
    `,
  });
};

// Use the same template as sendVerificationEmail for password reset, with custom subject and message
export const sendPasswordResetEmail = (email, link, username) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Reset Your Password",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">[Man9a] Password Reset</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Hello ${username || "User"},<br><br>
        Please click the button below to reset your password.</p>
        <a href="${link}" style="display:inline-block;padding:14px 36px;background:#2563FF;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;margin:24px 0 16px 0;">Click Here</a>
        <p style="color:#888;font-size:13px;margin-top:24px;">This link expires in 24 hours.<br>If you did not request a password reset, you can ignore this email.</p>
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.<br>Address: Your Company Address Here</div>
      </div>
    `,
  });
};
