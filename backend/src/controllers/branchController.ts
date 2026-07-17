import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, Branch } from '../services/dbService.js';

export const branchController = {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      res.json(dbService.branches);
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Error al obtener la lista de sucursales.' });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, address, phone, schedule, services } = req.body;

      if (!name || !address || !phone) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar sucursal.' });
      }

      // Check role: Admin only
      if (req.user?.role !== 'Admin') {
        return res.status(403).json({ error: 'Solo los administradores pueden añadir nuevas sucursales.' });
      }

      const newBranch: Branch = {
        id: `b-${Date.now()}`,
        name,
        address,
        phone,
        schedule: schedule || 'L-V: 8:00 AM - 6:00 PM',
        services: services || ['Odontología General'],
        active: true
      };

      dbService.insertBranch(newBranch);
      res.status(201).json(newBranch);
    } catch (error) {
      console.error('Error creating branch:', error);
      res.status(500).json({ error: 'Error al crear la sucursal.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const branchId = req.params.id;
      const branchIdx = dbService.branches.findIndex(b => b.id === branchId);
      if (branchIdx === -1) {
        return res.status(404).json({ error: 'Sucursal no encontrada.' });
      }

      // Check role: Admin or associated Manager
      const userRole = req.user?.role;
      const userBranches = req.user?.branchIds || [];
      if (userRole !== 'Admin' && !(userRole === 'Gerente de sucursal' && userBranches.includes(branchId))) {
        return res.status(403).json({ error: 'No tienes privilegios para modificar esta sucursal.' });
      }

      const updatedBranch = { ...dbService.branches[branchIdx], ...req.body };
      dbService.branches[branchIdx] = updatedBranch;
      dbService.save();

      res.json(updatedBranch);
    } catch (error) {
      console.error('Error updating branch:', error);
      res.status(500).json({ error: 'Error al actualizar la sucursal.' });
    }
  }
};
