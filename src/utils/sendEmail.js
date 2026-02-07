const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  console.log(`📧 Email Service Config: Host=${config.host}, Port=${config.port}, User=${config.auth.user}, Secure=${config.secure}`);
  return nodemailer.createTransport(config);
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.html - HTML content
 * @returns {Promise}
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"LexiLearn" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    console.log(`✅ Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 */
const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #f8fafc; border-radius: 24px; border: 1px solid #e2e8f0;">
      <h1 style="color: #4F46E5; margin-bottom: 24px;">Welcome to LexiLearn!</h1>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Hi ${user.fullName},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">Thank you for joining our platform as a <strong>${user.role}</strong>.</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6;">We're excited to have you on board!</p>
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
        <p style="font-size: 14px; color: #94a3b8;">Best regards,<br>The LexiLearn Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Welcome to LexiLearn',
    html
  });
};

/**
 * Send 6-digit OTP for email verification (Registration)
 * @param {Object} user - User object
 * @param {String} otp - 6-digit OTP code
 */
const sendRegistrationOTPEmail = async (user, otp) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4F46E5; font-size: 28px; font-weight: 800; margin: 0;">Verify Your Account</h1>
      </div>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">Hi ${user.fullName},</p>
      <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 32px;">To complete your registration, please enter the following 6-digit verification code:</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <div style="display: inline-block; padding: 24px 48px; background-color: #f1f5f9; border: 2px solid #4F46E5; color: #4F46E5; font-size: 42px; font-weight: 900; letter-spacing: 12px; border-radius: 20px;">
          ${otp}
        </div>
      </div>
      
      <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 32px;">
        This code is valid for 10 minutes. If you didn't request this, please ignore this email.
      </p>
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 12px; color: #cbd5e1;">&copy; ${new Date().getFullYear()} LexiLearn Team</p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: `Your Verification Code: ${otp}`,
    html
  });
};

/**
 * Send 6-digit OTP for password reset
 * @param {Object} user - User object
 * @param {String} otp - 6-digit OTP code
 */
const sendOTPEmail = async (user, otp) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0;">
      <h1 style="color: #4F46E5; font-size: 24px; margin-bottom: 24px;">Password Reset Code</h1>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">Hi ${user.fullName},</p>
      <p style="color: #475569; font-size: 16px; line-height: 1.6;">You requested a password reset. Use the following 6-digit code to proceed:</p>
      <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; padding: 20px 40px; background-color: #f8fafc; border: 2px dashed #4F46E5; color: #4F46E5; font-size: 32px; font-weight: 900; letter-spacing: 8px; border-radius: 12px;">
          ${otp}
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">This code is valid for 10 minutes. If you didn't request this, please secure your account.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0;">
      <p style="color: #cbd5e1; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} LexiLearn Team</p>
    </div>
  `;

  return await sendEmail({
    to: user.email,
    subject: 'Your Password Reset Code',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRegistrationOTPEmail,
  sendOTPEmail
};

