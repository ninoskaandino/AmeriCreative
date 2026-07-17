import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { dbService, User } from '../services/dbService.js';
import { config } from '../config.js';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role, branchIds } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Faltan campos requeridos (name, email, password, role)' });
      }

      // Check if user exists
      const existingUser = dbService.users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const newUser: User = {
        id: `u-${Date.now()}`,
        name,
        email,
        passwordHash,
        role,
        branchIds: branchIds || [],
        createdAt: new Date().toISOString(),
      };

      dbService.insertUser(newUser);

      // Create JWT token
      const token = jwt.sign(
        { userId: newUser.id, role: newUser.role, branchIds: newUser.branchIds },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          branchIds: newUser.branchIds,
          avatar: newUser.avatar,
        },
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Error interno del servidor al registrar.' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Por favor proporcione correo y contraseña.' });
      }

      const user = dbService.users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      const isMatch = bcrypt.compareSync(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }

      // Create JWT token
      const token = jwt.sign(
        { userId: user.id, role: user.role, branchIds: user.branchIds },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchIds: user.branchIds,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Error interno del servidor al iniciar sesión.' });
    }
  },

  async me(req: Request & { user?: any }, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const user = dbService.users.find(u => u.id === req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchIds: user.branchIds,
        avatar: user.avatar,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
};
