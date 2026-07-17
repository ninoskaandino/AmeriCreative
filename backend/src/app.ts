import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authController } from './controllers/authController.js';
import { imageController } from './controllers/imageController.js';
import { contentController } from './controllers/contentController.js';
import { campaignController } from './controllers/campaignController.js';
import { branchController } from './controllers/branchController.js';
import { commentController } from './controllers/commentController.js';
import { approvalController } from './controllers/approvalController.js';
import { authMiddleware, requireRole } from './middlewares/authMiddleware.js';

const app = express();

// 1. Core Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows displaying local images in frontend
}));
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit input payload size

// Rate limiting: maximum 100000 requests per 15 minutes per IP (prevent blocking local testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  message: { error: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo en 15 minutos.' }
});
app.use('/api/', limiter);

// 2. Global Request Logger (For audit trails)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 3. API ROUTES

// --- Authentication ---
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authMiddleware, authController.me);

// --- Images (AI Bedrock) ---
app.post('/api/images/generate', authMiddleware, imageController.generate);
app.get('/api/images', authMiddleware, imageController.getAll);
app.get('/api/images/:id', authMiddleware, imageController.getById);
app.delete('/api/images/:id', authMiddleware, imageController.delete);
app.post('/api/images/:id/variations', authMiddleware, imageController.createVariation);

// --- Copywriting (AI Bedrock) ---
app.post('/api/content/generate', authMiddleware, contentController.generate);
app.post('/api/content/edit', authMiddleware, contentController.edit);
app.post('/api/content/review', authMiddleware, contentController.clinicalReview);
app.get('/api/content', authMiddleware, contentController.getAll);
app.get('/api/content/:id', authMiddleware, contentController.getById);
app.post('/api/content/:id/versions', authMiddleware, contentController.createVersion);
app.post('/api/content/:id/restore/:versionId', authMiddleware, contentController.restoreVersion);

// --- Campaigns ---
app.get('/api/campaigns', authMiddleware, campaignController.getAll);
app.post('/api/campaigns', authMiddleware, campaignController.create);
app.get('/api/campaigns/:id', authMiddleware, campaignController.getById);
app.put('/api/campaigns/:id', authMiddleware, campaignController.update);
app.delete('/api/campaigns/:id', authMiddleware, campaignController.delete);

// --- Branches ---
app.get('/api/branches', authMiddleware, branchController.getAll);
app.post('/api/branches', authMiddleware, branchController.create);
app.put('/api/branches/:id', authMiddleware, branchController.update);

// --- Comments ---
app.post('/api/comments', authMiddleware, commentController.create);
app.get('/api/comments/:resourceType/:resourceId', authMiddleware, commentController.getByResource);
app.put('/api/comments/:id', authMiddleware, commentController.update);

// --- Approvals ---
app.post('/api/approvals/:resourceType/:resourceId/approve', authMiddleware, approvalController.approve);
app.post('/api/approvals/:resourceType/:resourceId/reject', authMiddleware, approvalController.reject);
app.post('/api/approvals/:resourceType/:resourceId/request-changes', authMiddleware, approvalController.requestChanges);
app.get('/api/approvals/:resourceType/:resourceId', authMiddleware, approvalController.getApprovals);

// 4. Default Hello Endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ name: 'Amerident Creative Studio API', version: '1.0.0', status: 'Running' });
});

// 5. Global Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
});

export default app;
