import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { Types } from 'mongoose';
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ERROR_MESSAGES } from '../utils/constants.js';
import type { JwtPayload } from '../types/index.js';

type IdLike = string | Types.ObjectId;

/**
 * Protect routes - verify the JWT access token and attach the user to the request.
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: ERROR_MESSAGES.UNAUTHORIZED });
      return;
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!user) {
        res.status(401).json({ success: false, message: ERROR_MESSAGES.USER_NOT_FOUND });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({ success: false, message: 'Your account has been deactivated' });
        return;
      }

      req.user = user;
      next();
    } catch {
      res.status(401).json({ success: false, message: ERROR_MESSAGES.INVALID_TOKEN });
    }
  } catch {
    res.status(500).json({ success: false, message: ERROR_MESSAGES.SERVER_ERROR });
  }
};

/** Generate a short-lived JWT access token. */
export const generateAccessToken = (id: IdLike): string => {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRE as SignOptions['expiresIn'] };
  return jwt.sign({ id: id.toString() }, env.JWT_SECRET, options);
};

/** Generate a long-lived JWT refresh token. */
export const generateRefreshToken = (id: IdLike): string => {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRE as SignOptions['expiresIn'] };
  return jwt.sign({ id: id.toString() }, env.JWT_REFRESH_SECRET, options);
};

/** Verify a refresh token and return its decoded payload. */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
  }
};
