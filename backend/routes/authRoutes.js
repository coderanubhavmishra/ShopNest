const express = require('express');
const { registerUser,verifyOtp, resendOtp, loginUser, getUsers, deleteUser, makeAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.post('/users/admin', protect, admin, makeAdmin);

module.exports = router;