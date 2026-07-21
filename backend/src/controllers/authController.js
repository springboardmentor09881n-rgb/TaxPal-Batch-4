const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create a reusable nodemailer transporter from .env credentials
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Helper: send email
async function sendEmail({ to, subject, html }) {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      throw new Error('SMTP credentials are not configured in .env');
    }
    await transporter.sendMail({
      from: `"TaxPal" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email successfully sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('Email send error:', err.message);
    console.log('\n--- [DEVELOPMENT/DEBUG EMAIL LOGGER] ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    // Clean html to print readable text
    const cleanText = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    console.log(`Content Summary: ${cleanText.substring(0, 200)}...`);
    
    // Extract and explicitly print any href link for easy developer clicking
    const linkMatch = html.match(/href="([^"]+)"/);
    if (linkMatch && linkMatch[1]) {
      console.log(`Extracted Link: ${linkMatch[1]}`);
    }
    console.log('----------------------------------------\n');
  }
}

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, password, fullName, email, country, incomeBracket } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });
    if (existingUser || existingUsername) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the user
    const user = await User.create({
      username,
      password: hashedPassword,
      fullName,
      email,
      country,
      incomeBracket,
    });

    // Send welcome email (non-blocking)
    sendEmail({
      to: email,
      subject: '🎉 Welcome to TaxPal!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: #1e40af; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="display:inline-block; background:#3b82f6; width:56px; height:56px; border-radius:12px; line-height:56px; font-size:24px; font-weight:900; color:white;">TP</div>
            <h1 style="color: white; margin: 12px 0 0; font-size: 24px;">Welcome to TaxPal!</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${fullName},</h2>
            <p style="color: #475569; line-height: 1.6;">Your TaxPal account has been created successfully. You can now sign in and start managing your finances, tracking expenses, and estimating taxes with ease.</p>
            <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Username:</strong> ${username}</p>
              <p style="margin: 8px 0 0; color: #64748b; font-size: 14px;"><strong>Country:</strong> ${country}</p>
            </div>
            <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block; background:#2563eb; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:8px;">Sign In to TaxPal</a>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't create this account, you can safely ignore this email.</p>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">© 2025 TaxPal. All rights reserved.</p>
        </div>
      `,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create a JWT payload
    const payload = {
      user: {
        id: user._id,
      },
    };

    // Sign the token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email, country: user.country, incomeBracket: user.incomeBracket } });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Forgot Password – generate token and send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return 200 to prevent user enumeration
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate a secure random token valid for 5 minutes
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: '🔒 TaxPal – Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px;">
          <div style="background: #1e40af; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <div style="display:inline-block; background:#3b82f6; width:56px; height:56px; border-radius:12px; line-height:56px; font-size:24px; font-weight:900; color:white;">TP</div>
            <h1 style="color: white; margin: 12px 0 0; font-size: 24px;">Password Reset</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 28px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${user.fullName},</h2>
            <p style="color: #475569; line-height: 1.6;">We received a request to reset your TaxPal password. Click the button below to set a new password.</p>
            <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 16px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e; font-size: 13px;">⏰ <strong>This link is valid for 5 minutes only.</strong></p>
            </div>
            <a href="${resetLink}" style="display:inline-block; background:#2563eb; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:8px;">Reset My Password</a>
            <p style="color: #64748b; font-size: 13px; margin-top: 20px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #2563eb; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <p style="color: #cbd5e1; font-size: 11px; text-align: center; margin-top: 16px;">© 2025 TaxPal. All rights reserved.</p>
        </div>
      `,
    });

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Reset Password – validate token and update password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }, // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new one.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear the reset token fields
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Change Password – validate current password and update password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Compare with current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password update.' });
  }
};
