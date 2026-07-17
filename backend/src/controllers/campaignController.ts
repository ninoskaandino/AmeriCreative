import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, Campaign } from '../services/dbService.js';

export const campaignController = {
  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      let campaigns = [...dbService.campaigns];
      const { branchId, status } = req.query;

      if (branchId) {
        campaigns = campaigns.filter(c => c.branchIds.includes(branchId as string));
      }
      if (status) {
        campaigns = campaigns.filter(c => c.status === status);
      }

      campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ error: 'Error al obtener campañas.' });
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const camp = dbService.campaigns.find(c => c.id === req.params.id);
      if (!camp) {
        return res.status(404).json({ error: 'Campaña no encontrada.' });
      }
      
      // Get related assets
      const relatedImages = dbService.images.filter(img => img.campaignId === camp.id);
      const relatedContents = dbService.contents.filter(doc => doc.campaignId === camp.id);

      res.json({
        campaign: camp,
        assets: {
          images: relatedImages,
          contents: relatedContents
        }
      });
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      res.status(500).json({ error: 'Error al obtener detalles de la campaña.' });
    }
  },

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        name, objective, audience, specialty, treatment, 
        branchIds, channels, status, startDate, endDate, budget, kpis 
      } = req.body;

      if (!name || !objective || !audience || !specialty || !treatment) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para crear campaña.' });
      }

      const userId = req.user?.userId || 'u-unknown';

      const newCampaign: Campaign = {
        id: `c-${Date.now()}`,
        name,
        objective,
        audience,
        specialty,
        treatment,
        branchIds: branchIds || [],
        channels: channels || [],
        status: status || 'Idea',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
        budget: budget || 0,
        responsibleId: userId,
        kpis: kpis || [],
        createdAt: new Date().toISOString()
      };

      dbService.insertCampaign(newCampaign);
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ error: 'Error al crear la campaña.' });
    }
  },

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const campId = req.params.id;
      const camp = dbService.campaigns.find(c => c.id === campId);
      if (!camp) {
        return res.status(404).json({ error: 'Campaña no encontrada.' });
      }

      // Authorization: Admin or Marketing can update campaigns
      const userRole = req.user?.role;
      if (userRole !== 'Admin' && userRole !== 'Marketing') {
        return res.status(403).json({ error: 'No tienes privilegios para modificar campañas de marketing.' });
      }

      const updated = dbService.updateCampaign(campId, req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ error: 'Error al actualizar la campaña.' });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const campId = req.params.id;
      const camp = dbService.campaigns.find(c => c.id === campId);
      if (!camp) {
        return res.status(404).json({ error: 'Campaña no encontrada.' });
      }

      // Authorization: Admin or Marketing can delete campaigns
      const userRole = req.user?.role;
      if (userRole !== 'Admin' && userRole !== 'Marketing') {
        return res.status(403).json({ error: 'No tienes privilegios para eliminar campañas.' });
      }

      dbService.deleteCampaign(campId);
      res.json({ message: 'Campaña eliminada exitosamente.', id: campId });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ error: 'Error al eliminar la campaña.' });
    }
  }
};
