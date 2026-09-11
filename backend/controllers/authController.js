const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const sendOtpToUser = async (user) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otpCode = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
  await user.save();

  const message = `
    <h2>Welcome to ShopNest, ${user.name}!</h2>
    <p>Your one-time verification OTP is: <strong>${otp}</strong></p>
    <p>It expires in 10 minutes.</p>
  `;

  await sendEmail({
    email: user.email,
    subject: 'ShopNest - Your OTP',
    message
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });

    if (existing && existing.verified) {
      return res.status(400).json({ message: 'User already exists. Please delete User First to make him  admin.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      user = existing;
    } else {
      user = new User({ name, email, password: hashedPassword });
    }

    await sendOtpToUser(user);

    res.status(201).json({
      email: user.email,
      message: 'OTP sent to your email. Please verify to complete registration.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otpCode +otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.verified) {
      return res.status(400).json({ message: 'Account already verified. Please login.' });
    }

    if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    const hashedOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (hashedOtp !== user.otpCode) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.verified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verified: user.verified,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otpCode +otpExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.verified) return res.status(400).json({ message: 'Account already verified. Please login.' });

    await sendOtpToUser(user);
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.verified) {
        return res.status(403).json({
          message: 'Your account is not verified. A new OTP has been sent to your email.',
          needsVerification: true,
          email: user.email
        });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const makeAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // User already exists -> say so, and make sure they are a verified admin
      existing.role = 'admin';
      existing.verified = true;
      await existing.save();
      return res.status(200).json({
        message: 'User already exists. Please login.',
        user: {
          _id: existing._id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          verified: true
        }
      });
    }

    // New user -> create admin directly with verified = true
    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      verified: true
    });

    res.status(201).json({
      message: 'Admin created successfully',
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        verified: true
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

module.exports = { registerUser, verifyOtp, resendOtp, loginUser, getUsers, deleteUser, makeAdmin };