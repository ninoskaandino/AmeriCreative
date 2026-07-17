import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, Approval } from '../services/dbService.js';

const STAGES = [
  'Borrador',
  'Revisión de marketing',
  'Revisión clínica',
  'Revisión de marca',
  'Aprobado',
  'Programado',
  'Publicado'
];

export const approvalController = {
  async approve(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;
      const { observations } = req.body;

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';
      const userRole = user ? user.role : 'Aprobador';

      if (resourceType === 'content') {
        const doc = dbService.contents.find(d => d.id === resourceId);
        if (!doc) {
          return res.status(404).json({ error: 'Contenido no encontrado.' });
        }

        // Validate who can approve at which stage
        if (doc.status === 'Revisión clínica' && userRole !== 'Odontólogo revisor' && userRole !== 'Admin') {
          return res.status(403).json({ error: 'Solo un Odontólogo Revisor o Administrador puede realizar la aprobación clínica.' });
        }
        if (doc.status === 'Revisión de marca' && userRole !== 'Aprobador' && userRole !== 'Admin') {
          return res.status(403).json({ error: 'Solo un Aprobador de Marca o Administrador puede realizar la aprobación de marca.' });
        }

        const currentStageIdx = STAGES.indexOf(doc.status);
        const nextStage = currentStageIdx < STAGES.length - 1 ? STAGES[currentStageIdx + 1] : doc.status;

        // Update Document Status
        dbService.updateContent(resourceId, { status: nextStage as any });

        // Insert Approval Log
        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'content',
          resourceId,
          stage: doc.status as any,
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Aprobado',
          observations: observations || 'Aprobado satisfactoriamente.',
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        return res.json({ 
          message: `Contenido aprobado y avanzado a: ${nextStage}`, 
          document: doc, 
          approval: newApproval 
        });
      } else if (resourceType === 'image') {
        const img = dbService.images.find(i => i.id === resourceId);
        if (!img) {
          return res.status(404).json({ error: 'Imagen no encontrada.' });
        }

        dbService.db.images = dbService.db.images.map(i => {
          if (i.id === resourceId) {
            i.approvalStatus = 'Aprobado';
          }
          return i;
        });
        dbService.save();

        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'image',
          resourceId,
          stage: 'Aprobado',
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Aprobado',
          observations: observations || 'Diseño visual aprobado.',
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        return res.json({ 
          message: 'Imagen aprobada exitosamente.', 
          image: img, 
          approval: newApproval 
        });
      }

      res.status(400).json({ error: 'Tipo de recurso inválido.' });
    } catch (error) {
      console.error('Error approving resource:', error);
      res.status(500).json({ error: 'Error al procesar la aprobación.' });
    }
  },

  async reject(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;
      const { observations } = req.body;

      if (!observations) {
        return res.status(400).json({ error: 'Debe proporcionar observaciones sobre el rechazo.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';
      const userRole = user ? user.role : 'Aprobador';

      if (resourceType === 'content') {
        const doc = dbService.contents.find(d => d.id === resourceId);
        if (!doc) {
          return res.status(404).json({ error: 'Contenido no encontrado.' });
        }

        // Return to Borrador on rejection
        dbService.updateContent(resourceId, { status: 'Borrador' });

        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'content',
          resourceId,
          stage: doc.status as any,
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Rechazado',
          observations,
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        return res.json({ 
          message: 'Contenido rechazado y devuelto a borrador.', 
          document: doc, 
          approval: newApproval 
        });
      } else if (resourceType === 'image') {
        const img = dbService.images.find(i => i.id === resourceId);
        if (!img) {
          return res.status(404).json({ error: 'Imagen no encontrada.' });
        }

        dbService.db.images = dbService.db.images.map(i => {
          if (i.id === resourceId) {
            i.approvalStatus = 'Rechazado';
          }
          return i;
        });
        dbService.save();

        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'image',
          resourceId,
          stage: 'Borrador' as any,
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Rechazado',
          observations,
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        return res.json({ 
          message: 'Imagen rechazada con éxito.', 
          image: img, 
          approval: newApproval 
        });
      }

      res.status(400).json({ error: 'Tipo de recurso inválido.' });
    } catch (error) {
      console.error('Error rejecting resource:', error);
      res.status(500).json({ error: 'Error al rechazar el recurso.' });
    }
  },

  async requestChanges(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;
      const { observations } = req.body;

      if (!observations) {
        return res.status(400).json({ error: 'Debe indicar los cambios requeridos.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';
      const userRole = user ? user.role : 'Aprobador';

      if (resourceType === 'content') {
        const doc = dbService.contents.find(d => d.id === resourceId);
        if (!doc) {
          return res.status(404).json({ error: 'Contenido no encontrado.' });
        }

        // Return to prior step or Borrador
        const currentStageIdx = STAGES.indexOf(doc.status);
        const prevStage = currentStageIdx > 0 ? STAGES[currentStageIdx - 1] : 'Borrador';

        dbService.updateContent(resourceId, { status: prevStage as any });

        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'content',
          resourceId,
          stage: doc.status as any,
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Cambios solicitados',
          observations,
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        // Add automated feedback comment
        dbService.insertComment({
          id: `com-${Date.now()}`,
          resourceType: 'content',
          resourceId,
          userId,
          userName,
          userRole,
          message: `🔬 [CAMBIOS SOLICITADOS]: ${observations}`,
          resolved: false,
          createdAt: new Date().toISOString()
        });

        return res.json({ 
          message: `Cambios solicitados. Estado devuelto a: ${prevStage}`, 
          document: doc, 
          approval: newApproval 
        });
      } else if (resourceType === 'image') {
        const img = dbService.images.find(i => i.id === resourceId);
        if (!img) {
          return res.status(404).json({ error: 'Imagen no encontrada.' });
        }

        dbService.db.images = dbService.db.images.map(i => {
          if (i.id === resourceId) {
            i.approvalStatus = 'En revisión'; // remains in review
          }
          return i;
        });
        dbService.save();

        const newApproval: Approval = {
          id: `app-${Date.now()}`,
          resourceType: 'image',
          resourceId,
          stage: 'En revisión' as any,
          reviewerId: userId,
          reviewerName: userName,
          reviewerRole: userRole,
          status: 'Cambios solicitados',
          observations,
          createdAt: new Date().toISOString()
        };

        dbService.insertApproval(newApproval);

        dbService.insertComment({
          id: `com-${Date.now()}`,
          resourceType: 'image',
          resourceId,
          userId,
          userName,
          userRole,
          message: `🎨 [CAMBIOS SOLICITADOS]: ${observations}`,
          resolved: false,
          createdAt: new Date().toISOString()
        });

        return res.json({ 
          message: 'Cambios solicitados registrados en el historial.', 
          image: img, 
          approval: newApproval 
        });
      }

      res.status(400).json({ error: 'Tipo de recurso inválido.' });
    } catch (error) {
      console.error('Error requesting changes:', error);
      res.status(500).json({ error: 'Error al registrar la solicitud de cambios.' });
    }
  },

  async getApprovals(req: AuthenticatedRequest, res: Response) {
    try {
      const { resourceType, resourceId } = req.params;
      const history = dbService.approvals.filter(a => 
        a.resourceType === resourceType && a.resourceId === resourceId
      );

      history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(history);
    } catch (error) {
      console.error('Error fetching approval logs:', error);
      res.status(500).json({ error: 'Error al obtener bitácora de aprobaciones.' });
    }
  }
};
