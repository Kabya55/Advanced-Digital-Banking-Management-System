import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole, UserStatus } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    isBlocked: boolean;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.bank_auth_token) {
      token = req.cookies.bank_auth_token;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'advanced-digital-banking-secret-key-32chars';
    const decoded = jwt.verify(token, secret) as any;

    const user = await User.findById(decoded.userId).select('status isBlocked role name email');
    if (!user) {
      res.status(401).json({ success: false, error: 'User does not exist or has been deleted.' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ success: false, error: 'Your account has been blocked by administrators.' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ success: false, error: `Account is ${user.status}. Access denied.` });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isBlocked: user.isBlocked,
    };

    next();
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Role "${req.user.role}" does not have required permissions.`,
      });
      return;
    }

    next();
  };
};
