import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email, link) => {
  try {
    // Create transporter EVERY TIME the function is called
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"Manga App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email',
      html: `
        <h1>Welcome!</h1>
        <p>Click the link below to verify your email:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 24 hours.</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('📧 To:', email);
    console.log('🆔 Message ID:', info.messageId);
    return info;
    
  } catch (error) {
    console.error('❌ Email error details:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    throw error;
  }
};