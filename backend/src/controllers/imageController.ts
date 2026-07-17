import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, GeneratedImage } from '../services/dbService.js';
import { bedrockImageService } from '../services/bedrockImageService.js';
import { promptEnhancementService } from '../services/promptEnhancementService.js';
import { moderationService } from '../services/moderationService.js';

export const imageController = {
  async generate(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        objective, description, specialty, treatment, audience, 
        style, format, branchIds, campaignId, negativePrompt, 
        creativityLevel, numImages 
      } = req.body;

      if (!description || !specialty || !treatment || !audience || !style || !format) {
        return res.status(400).json({ error: 'Faltan campos requeridos para la generación de imagen.' });
      }

      console.log(`[Controller] generateImage request received. Prompt: "${description}"`);

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      // 1. Moderation Check
      const moderationResult = await moderationService.scanContent(description);
      if (!moderationResult.approved) {
        console.log(`[Controller] moderation check rejected: ${moderationResult.reason}`);
        return res.status(400).json({ 
          error: `Generación rechazada por políticas de moderación. Razón: ${moderationResult.reason}` 
        });
      }
      console.log(`[Controller] moderation check passed.`);

      // 2. Enhance Prompt
      const enhancedPrompt = await promptEnhancementService.enhancePrompt({
        description,
        specialty,
        audience,
        style,
        format
      });
      console.log(`[Controller] prompt enhanced. Enhanced prompt: "${enhancedPrompt}"`);

      // 3. Generate Image (supports Bedrock / offline Demo Mode fallback)
      const fileUrl = await bedrockImageService.generateImage({
        prompt: enhancedPrompt,
        negativePrompt,
        specialty,
        audience,
        style,
        format
      });
      console.log(`[Controller] image generated successfully. URL/Base64 length: ${fileUrl.length}`);

      // 4. Save to Database
      const newImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        campaignId,
        branchIds: branchIds || [],
        userId,
        userName,
        prompt: description,
        negativePrompt,
        style,
        format,
        fileUrl,
        model: 'Stable Diffusion XL',
        moderationStatus: 'Aprobado',
        approvalStatus: 'Borrador',
        version: 1,
        createdAt: new Date().toISOString()
      };

      dbService.insertImage(newImage);

      res.status(201).json(newImage);
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ error: 'Error interno del servidor al generar la imagen.' });
    }
  },

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      let images = [...dbService.images];

      // Filters
      const { campaignId, branchId, specialty, approvalStatus } = req.query;
      if (campaignId) {
        images = images.filter(img => img.campaignId === campaignId);
      }
      if (branchId) {
        images = images.filter(img => img.branchIds.includes(branchId as string));
      }
      if (approvalStatus) {
        images = images.filter(img => img.approvalStatus === approvalStatus);
      }
      if (specialty) {
        images = images.filter(img => img.prompt.toLowerCase().includes((specialty as string).toLowerCase()));
      }

      // Sort by newest
      images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(images);
    } catch (error) {
      console.error('Error fetching images:', error);
      res.status(500).json({ error: 'Error al obtener las imágenes.' });
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const img = dbService.images.find(i => i.id === req.params.id);
      if (!img) {
        return res.status(404).json({ error: 'Imagen no encontrada.' });
      }
      res.json(img);
    } catch (error) {
      console.error('Error fetching image details:', error);
      res.status(500).json({ error: 'Error al obtener la imagen.' });
    }
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const imgId = req.params.id;
      const img = dbService.images.find(i => i.id === imgId);
      if (!img) {
        return res.status(404).json({ error: 'Imagen no encontrada.' });
      }

      // Permissions check: marketing, designers or admin can delete
      const userRole = req.user?.role;
      if (userRole !== 'Admin' && userRole !== 'Marketing' && userRole !== 'Diseñador') {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este material visual.' });
      }

      dbService.deleteImage(imgId);
      res.json({ message: 'Imagen eliminada exitosamente.', id: imgId });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ error: 'Error al eliminar la imagen.' });
    }
  },

  async createVariation(req: AuthenticatedRequest, res: Response) {
    try {
      const parentId = req.params.id;
      const parentImg = dbService.images.find(i => i.id === parentId);
      if (!parentImg) {
        return res.status(404).json({ error: 'Imagen original no encontrada.' });
      }

      const { styleAdjustment } = req.body;
      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      // 1. Tweak prompt slightly
      const tweakedDescription = `${parentImg.prompt}, modified variation: ${styleAdjustment || 'different perspective, softer lighting'}`;

      // 2. Enhance Prompt
      const enhancedPrompt = await promptEnhancementService.enhancePrompt({
        description: tweakedDescription,
        specialty: 'Odontología general',
        audience: 'Adultos',
        style: parentImg.style,
        format: parentImg.format
      });

      // 3. Generate new file
      const fileUrl = await bedrockImageService.generateImage({
        prompt: enhancedPrompt,
        negativePrompt: parentImg.negativePrompt,
        specialty: 'Odontología general',
        audience: 'Adultos',
        style: parentImg.style,
        format: parentImg.format
      });

      // 4. Create new version record
      const variationImage: GeneratedImage = {
        id: `img-${Date.now()}`,
        campaignId: parentImg.campaignId,
        branchIds: parentImg.branchIds,
        userId,
        userName,
        prompt: tweakedDescription,
        negativePrompt: parentImg.negativePrompt,
        style: parentImg.style,
        format: parentImg.format,
        fileUrl,
        model: parentImg.model,
        moderationStatus: 'Aprobado',
        approvalStatus: 'Borrador',
        version: parentImg.version + 1,
        createdAt: new Date().toISOString()
      };

      dbService.insertImage(variationImage);
      res.status(201).json(variationImage);
    } catch (error) {
      console.error('Error creating variation:', error);
      res.status(500).json({ error: 'Error al crear la variación visual.' });
    }
  }
};
