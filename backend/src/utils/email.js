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

// Send verification email
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
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// Send password reset email
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
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// ============ NEW DELETION EMAILS ============

// Send account deletion verification email
export const sendDeletionEmail = async (email, data) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Account Deletion Request",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">[Man9a] Account Deletion Request</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Hello ${data.name},<br><br>
        We received a request to delete your account.</p>
        
        <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="font-size:14px;color:#666;margin-bottom:8px;">Your verification code:</p>
          <h1 style="font-size:48px;letter-spacing:8px;color:#2563FF;margin:10px 0;">${data.code}</h1>
          <p style="font-size:14px;color:#666;">This code expires in <strong>15 minutes</strong></p>
        </div>
        
        <p style="color:#444;font-size:16px;margin-bottom:16px;">Your account will be permanently deleted on:<br> 
        <strong style="color:#2563FF;font-size:18px;">${data.deletionDate}</strong></p>
        
        <div style="background:#fff3cd;border-radius:8px;padding:15px;margin:20px 0;border:1px solid #ffe69c;">
          <p style="color:#856404;margin:0;font-size:14px;">⚠️ Your account is now locked. You cannot use the app until you either confirm or cancel deletion.</p>
        </div>
        
        <p style="color:#444;font-size:16px;margin-bottom:24px;">To cancel this request, click the button below:</p>
        <a href="${data.cancelLink}" style="display:inline-block;padding:14px 36px;background:#6c757d;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;margin:24px 0 16px 0;">Cancel Deletion</a>
        
        <p style="color:#888;font-size:13px;margin-top:24px;">If you did not request this, please secure your account immediately.<br>
        You have 15 days to cancel this request before permanent deletion.</p>
        
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// Send deletion confirmation email
export const sendDeletionConfirmedEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Account Permanently Deleted",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">[Man9a] Account Deleted</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Goodbye ${name},<br><br>
        Your account has been permanently deleted as requested.</p>
        
        <div style="background:#f8d7da;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #f5c6cb;">
          <p style="color:#721c24;margin:0;font-size:16px;">✅ All your data has been removed from our system.</p>
        </div>
        
        <p style="color:#888;font-size:14px;margin-top:24px;">We're sorry to see you go. If this was a mistake, you'll need to create a new account.</p>
        
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// Send deletion cancellation email
export const sendDeletionCancelledEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Account Deletion Cancelled",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">[Man9a] Deletion Cancelled</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Welcome back ${name}!<br><br>
        Your account deletion has been cancelled.</p>
        
        <div style="background:#d4edda;border-radius:8px;padding:20px;margin:20px 0;border:1px solid #c3e6cb;">
          <p style="color:#155724;margin:0;font-size:16px;">🎉 Your account is now fully restored and unlocked.</p>
        </div>
        
        <p style="color:#888;font-size:14px;margin-top:24px;">You can continue using Man9a normally.</p>
        
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// Send welcome email after successful verification
export const sendWelcomeEmail = (email, username) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Welcome to the Community! 🎉",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">Welcome ${username}! 🎉</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">
          Your email has been verified and your account is now active.
        </p>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">
          Start reading your favorite manga now!
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display:inline-block;padding:14px 36px;background:#2563FF;color:#fff;font-weight:bold;border-radius:8px;text-decoration:none;font-size:18px;margin:24px 0 16px 0;">
          Start Reading
        </a>
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">Please do not reply to this email as it is auto-generated.<br><br>&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};

// Send deletion scheduled email (after verification)
export const sendDeletionScheduledEmail = async (email, data) => {
  return sendEmail({
    to: email,
    subject: "[Man9a] Account Deletion Scheduled",
    html: `
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px #0001;padding:32px 24px;font-family:sans-serif;text-align:center;">
        <img src="${logoUrl}" alt="Man9a Logo" style="width:220px;height:60px;margin-bottom:18px;border-radius:16px;" />
        <h2 style="color:#222;margin-bottom:8px;">Deletion Confirmed</h2>
        <p style="color:#444;font-size:16px;margin-bottom:24px;">Hello ${data.name},<br><br>
        Your account deletion has been confirmed.</p>
        
        <div style="background:#f5f5f5;border-radius:8px;padding:20px;margin:20px 0;">
          <p style="font-size:14px;color:#666;margin-bottom:8px;">Your account will be permanently deleted on:</p>
          <h2 style="color:#dc3545;margin:10px 0;">${data.deletionDate}</h2>
        </div>
        
        <p style="color:#444;font-size:16px;margin-bottom:24px;">You can login within the next 15 days to cancel this request.</p>
        
        <hr style="margin:32px 0 16px 0;border:none;border-top:1px solid #eee;" />
        <div style="color:#aaa;font-size:12px;">&copy; ${new Date().getFullYear()} Man9a. All rights reserved.</div>
      </div>
    `,
  });
};