const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret_key_here'; // Use environment variable in production

const sendOTPEmail = require('../utils/emailService');

// In-memory OTP stores (for demo purpose)
const otpStore = {};       // For signup
const resetOtpStore = {};  // For forgot-password

// Helper: Validate Email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===================== SIGNUP FLOW =====================

// 🔹 Request OTP for Signup
router.post('/signup/request-otp', async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ message: 'Failed to send OTP email' });
  }
});

// 🔹 Resend OTP for Signup
router.post('/signup/resend-otp', async (req, res) => {
  const { email } = req.body;

  // Optionally check if email is valid or exists in DB if needed

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

  try {
    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP resent to your email' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ message: 'Failed to resend OTP email' });
  }
});

// 🔹 Verify OTP
router.post('/signup/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (!record) return res.status(400).json({ message: 'No OTP sent to this email' });
  if (Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  delete otpStore[email]; // Clean up
  res.json({ message: 'Email verified successfully' });
});

// 🔹 Signup
router.post('/signup', async (req, res) => {
  const { username, phone, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, phone, email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// ===================== LOGIN =====================

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    let user;
    if (isValidEmail(identifier)) {
      user = await User.findOne({ email: identifier });
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      token,
      user: {
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ===================== FORGOT PASSWORD FLOW =====================

// 🔹 Request OTP for password reset
router.post('/forgot-password/request-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// 🔹 Resend OTP for password reset
router.post('/forgot-password/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    resetOtpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    await sendOTPEmail(email, otp);
    res.json({ message: 'OTP resent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
});

// 🔹 Verify OTP for password reset
router.post('/forgot-password/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const record = resetOtpStore[email];

  if (!record) return res.status(400).json({ message: 'No OTP sent to this email' });
  if (Date.now() > record.expires) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  res.json({ message: 'OTP verified successfully' });
});

// 🔹 Reset password
router.post('/forgot-password/reset', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email not registered' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete resetOtpStore[email];
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

module.exports = router;
