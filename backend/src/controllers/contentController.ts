import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';
import { dbService, ContentDocument, ContentVersion } from '../services/dbService.js';
import { bedrockTextService } from '../services/bedrockTextService.js';
import { moderationService } from '../services/moderationService.js';
import { clinicalContentReviewService } from '../services/clinicalContentReviewService.js';

export const contentController = {
  async generate(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        title, objective, audience, specialty, treatment, 
        channel, tone, extension, cta, language, branchIds, campaignId 
      } = req.body;

      if (!title || !specialty || !treatment || !audience || !channel || !tone) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para generar texto.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      // 1. Generate text via Bedrock Claude / offline Simulator
      const textResult = await bedrockTextService.generateText({
        objective,
        audience,
        specialty,
        treatment,
        channel,
        tone,
        extension,
        cta,
        language,
        branchName: branchIds && branchIds.length > 0 
          ? dbService.branches.find(b => b.id === branchIds[0])?.name 
          : undefined
      });

      // 2. Moderation Scan
      const modResult = await moderationService.scanContent(textResult);
      if (!modResult.approved) {
        return res.status(400).json({ 
          error: `Texto rechazado por políticas de privacidad o moderación: ${modResult.reason}` 
        });
      }

      // 3. Create document record
      const docId = `doc-${Date.now()}`;
      const newDoc: ContentDocument = {
        id: docId,
        title,
        contentType: channel,
        campaignId,
        branchIds: branchIds || [],
        specialty,
        treatment,
        audience,
        channel,
        tone,
        originalContent: textResult,
        currentContent: textResult,
        status: 'Borrador',
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dbService.insertContent(newDoc);

      // 4. Create version record
      const newVer: ContentVersion = {
        id: `v-${Date.now()}`,
        documentId: docId,
        content: textResult,
        action: 'Creado por IA',
        versionNumber: 1,
        authorId: userId,
        authorName: userName,
        createdAt: new Date().toISOString()
      };

      dbService.insertVersion(newVer);

      res.status(201).json({ document: newDoc, version: newVer });
    } catch (error) {
      console.error('Error generating copywriting:', error);
      res.status(500).json({ error: 'Error al redactar el contenido.' });
    }
  },

  async edit(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, action, tone, documentId } = req.body;

      if (!text || !action) {
        return res.status(400).json({ error: 'Se requiere el texto original y la acción a realizar.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      // 1. Edit text using Bedrock/Mock
      const editedText = await bedrockTextService.editText({ text, action, tone });

      // 2. Moderation Scan
      const modResult = await moderationService.scanContent(editedText);
      if (!modResult.approved) {
        return res.status(400).json({ 
          error: `Edición rechazada por moderación: ${modResult.reason}` 
        });
      }

      // 3. Save as version if a document ID is provided
      if (documentId) {
        const doc = dbService.contents.find(d => d.id === documentId);
        if (doc) {
          // Get next version number
          const docVersions = dbService.versions.filter(v => v.documentId === documentId);
          const nextVersionNumber = docVersions.length > 0 
            ? Math.max(...docVersions.map(v => v.versionNumber)) + 1 
            : 1;

          // Update Document
          dbService.updateContent(documentId, {
            currentContent: editedText,
            status: doc.status === 'Aprobado' ? 'Revisión de marketing' : doc.status // reset status if approved to re-evaluate
          });

          // Add Version
          const newVer: ContentVersion = {
            id: `v-${Date.now()}`,
            documentId,
            content: editedText,
            action: `Edición de IA: ${action}`,
            versionNumber: nextVersionNumber,
            authorId: userId,
            authorName: userName,
            createdAt: new Date().toISOString()
          };
          dbService.insertVersion(newVer);

          return res.json({ text: editedText, version: newVer });
        }
      }

      res.json({ text: editedText });
    } catch (error) {
      console.error('Error editing text:', error);
      res.status(500).json({ error: 'Error al refinar el texto.' });
    }
  },

  async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      let docs = [...dbService.contents];
      const { campaignId, branchId, status, specialty } = req.query;

      if (campaignId) {
        docs = docs.filter(d => d.campaignId === campaignId);
      }
      if (branchId) {
        docs = docs.filter(d => d.branchIds.includes(branchId as string));
      }
      if (status) {
        docs = docs.filter(d => d.status === status);
      }
      if (specialty) {
        docs = docs.filter(d => d.specialty.toLowerCase() === (specialty as string).toLowerCase());
      }

      docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      res.json(docs);
    } catch (error) {
      console.error('Error fetching copy documents:', error);
      res.status(500).json({ error: 'Error al obtener los contenidos.' });
    }
  },

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const doc = dbService.contents.find(d => d.id === req.params.id);
      if (!doc) {
        return res.status(404).json({ error: 'Contenido no encontrado.' });
      }

      const versions = dbService.versions
        .filter(v => v.documentId === doc.id)
        .sort((a, b) => b.versionNumber - a.versionNumber);

      res.json({ document: doc, versions });
    } catch (error) {
      console.error('Error fetching content details:', error);
      res.status(500).json({ error: 'Error al obtener el contenido.' });
    }
  },

  async createVersion(req: AuthenticatedRequest, res: Response) {
    try {
      const docId = req.params.id;
      const { content } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'El contenido no puede estar vacío.' });
      }

      const doc = dbService.contents.find(d => d.id === docId);
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      // Moderation scan
      const modResult = await moderationService.scanContent(content);
      if (!modResult.approved) {
        return res.status(400).json({ error: `Guardado bloqueado por moderación: ${modResult.reason}` });
      }

      // Check next version number
      const docVersions = dbService.versions.filter(v => v.documentId === docId);
      const nextVersionNumber = docVersions.length > 0 
        ? Math.max(...docVersions.map(v => v.versionNumber)) + 1 
        : 1;

      // Update Document
      dbService.updateContent(docId, { currentContent: content });

      // Save Version
      const newVer: ContentVersion = {
        id: `v-${Date.now()}`,
        documentId: docId,
        content,
        action: 'Edición Manual',
        versionNumber: nextVersionNumber,
        authorId: userId,
        authorName: userName,
        createdAt: new Date().toISOString()
      };
      dbService.insertVersion(newVer);

      res.status(201).json({ document: doc, version: newVer });
    } catch (error) {
      console.error('Error saving manual version:', error);
      res.status(500).json({ error: 'Error al guardar la versión.' });
    }
  },

  async restoreVersion(req: AuthenticatedRequest, res: Response) {
    try {
      const { id: docId, versionId } = req.params;

      const doc = dbService.contents.find(d => d.id === docId);
      if (!doc) {
        return res.status(404).json({ error: 'Documento no encontrado.' });
      }

      const version = dbService.versions.find(v => v.id === versionId && v.documentId === docId);
      if (!version) {
        return res.status(404).json({ error: 'Versión no encontrada.' });
      }

      const userId = req.user?.userId || 'u-unknown';
      const user = dbService.users.find(u => u.id === userId);
      const userName = user ? user.name : 'Usuario';

      const docVersions = dbService.versions.filter(v => v.documentId === docId);
      const nextVersionNumber = Math.max(...docVersions.map(v => v.versionNumber)) + 1;

      // Update Document
      dbService.updateContent(docId, { currentContent: version.content });

      // Save Restore Version Record
      const newVer: ContentVersion = {
        id: `v-${Date.now()}`,
        documentId: docId,
        content: version.content,
        action: `Restaurado a v${version.versionNumber}`,
        versionNumber: nextVersionNumber,
        authorId: userId,
        authorName: userName,
        createdAt: new Date().toISOString()
      };
      dbService.insertVersion(newVer);

      res.json({ document: doc, version: newVer });
    } catch (error) {
      console.error('Error restoring version:', error);
      res.status(500).json({ error: 'Error al restaurar la versión.' });
    }
  },

  async clinicalReview(req: AuthenticatedRequest, res: Response) {
    try {
      const { text, specialty, treatment } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Se requiere el texto a evaluar.' });
      }

      const result = await clinicalContentReviewService.reviewContent(
        text, 
        specialty || 'General', 
        treatment || 'Profilaxis'
      );
      res.json(result);
    } catch (error) {
      console.error('Error in clinical review endpoint:', error);
      res.status(500).json({ error: 'Error al realizar la auditoría clínica.' });
    }
  }
};
