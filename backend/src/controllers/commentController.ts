import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, Comment } from '../services/dbService.js';

export const commentController = {
  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId, message, parentCommentId } = req.body;

      if (!resourceType || !resourceId || !message) {
        return res.status(400).json({ error: 'Faltan campos requeridos (resourceType, resourceId, message)' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';
      const userRole = user ? user.role : 'Colaborador';

      const newComment: Comment = {
        id: `com-${Date.now()}`,
        resourceType,
        resourceId,
        userId,
        userName,
        userRole,
        message,
        parentCommentId,
        resolved: false,
        createdAt: new Date().toISOString()
      };

      dbService.insertComment(newComment);
      res.status(201).json(newComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Error al agregar el comentario.' });
    }
  },

  async getByResource(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;

      const comments = dbService.comments.filter(c => 
        c.resourceType === resourceType && c.resourceId === resourceId
      );

      // Sort oldest first (chronological conversation flow)
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ error: 'Error al obtener comentarios.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { resolved, message } = req.body;

      const updated = dbService.updateComment(id, { resolved, message });
      if (!updated) {
        return res.status(404).json({ error: 'Comentario no encontrado.' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Error al actualizar el comentario.' });
    }
  }
};
