import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import {
  registerValidation,
  loginValidation,
  changePasswordValidation,
  validate,
} from '../middlewares/validationMiddleware.js';

const router = Router();

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validate, changePassword);

export default router;
