import nodemailer from "nodemailer";

// ── Create the mail transporter once ──────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an OTP email to the user
 * @param {string} toEmail - Recipient email address
 * @param {string} otp     - The 6-digit OTP code
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"ChatApp" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Your ChatApp Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #128C7E;">Welcome to ChatApp 💬</h2>
        <p>Your one-time verification code is:</p>

        <div style="
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 10px;
          color: #075E54;
          background: #f0f0f0;
          padding: 16px 24px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
        ">
          ${otp}
        </div>

        <p>This code expires in <strong>${process.env.OTP_EXPIRES_MINUTES} minutes</strong>.</p>
        <p style="color: #888; font-size: 12px;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Generate a random 6-digit OTP
 * @returns {string}
 */
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export { sendOtpEmail, generateOtp };