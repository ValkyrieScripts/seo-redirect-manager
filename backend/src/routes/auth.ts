import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../db/database';
import { User, LoginRequest, AuthResponse } from '../models/types';

export const authRouter = Router();

// Login
authRouter.post('/login', (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const validPassword = bcrypt.compareSync(password, user.password_hash);
  if (!validPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'default-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    secret,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );

  const response: AuthResponse = {
    token,
    user: {
      id: user.id,
      username: user.username,
    },
  };

  res.json(response);
});

// Change password
authRouter.post('/change-password', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'default-secret';

  try {
    const decoded = jwt.verify(token, secret) as { userId: number };
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password required' });
      return;
    }

    const db = getDatabase();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as User | undefined;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const validPassword = bcrypt.compareSync(currentPassword, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newPasswordHash, decoded.userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Verify token
authRouter.get('/verify', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'default-secret';

  try {
    const decoded = jwt.verify(token, secret) as { userId: number; username: string };
    res.json({ valid: true, user: { id: decoded.userId, username: decoded.username } });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});
