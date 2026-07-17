import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Define DB structures based on user request models
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Marketing' | 'Diseñador' | 'Redactor' | 'Odontólogo revisor' | 'Aprobador' | 'Gerente de sucursal';
  branchIds: string[]; // Associated branches (especially for managers/local users)
  avatar?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  schedule: string;
  services: string[];
  active: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  audience: string;
  specialty: string;
  treatment: string;
  branchIds: string[];
  channels: string[];
  status: 'Idea' | 'En preparación' | 'En revisión' | 'Aprobada' | 'Programada' | 'Publicada' | 'Finalizada' | 'Archivada';
  startDate: string;
  endDate: string;
  budget: number;
  responsibleId: string;
  kpis: string[];
  createdAt: string;
}

export interface GeneratedImage {
  id: string;
  campaignId?: string;
  branchIds: string[];
  userId: string;
  userName?: string;
  prompt: string;
  negativePrompt?: string;
  style: string;
  format: string;
  fileUrl: string;
  model: string;
  moderationStatus: 'Aprobado' | 'Rechazado' | 'Pendiente';
  approvalStatus: 'Borrador' | 'En revisión' | 'Aprobado' | 'Rechazado';
  version: number;
  createdAt: string;
}

export interface ContentDocument {
  id: string;
  title: string;
  contentType: string;
  campaignId?: string;
  branchIds: string[];
  specialty: string;
  treatment: string;
  audience: string;
  channel: string;
  tone: string;
  originalContent: string;
  currentContent: string;
  status: 'Borrador' | 'Revisión de marketing' | 'Revisión clínica' | 'Revisión de marca' | 'Aprobado' | 'Programado' | 'Publicado';
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentVersion {
  id: string;
  documentId: string;
  content: string;
  action: string; // e.g. "Creado", "Edición de IA", "Edición manual", "Restaurado"
  versionNumber: number;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  resourceType: 'image' | 'content' | 'campaign';
  resourceId: string;
  userId: string;
  userName: string;
  userRole: string;
  message: string;
  parentCommentId?: string;
  resolved: boolean;
  createdAt: string;
}

export interface Approval {
  id: string;
  resourceType: 'image' | 'content';
  resourceId: string;
  stage: 'Revisión de marketing' | 'Revisión clínica' | 'Revisión de marca' | 'Aprobado';
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  status: 'Aprobado' | 'Rechazado' | 'Cambios solicitados';
  observations: string;
  createdAt: string;
}

// Database schema
interface DatabaseSchema {
  users: User[];
  branches: Branch[];
  campaigns: Campaign[];
  images: GeneratedImage[];
  contents: ContentDocument[];
  versions: ContentVersion[];
  comments: Comment[];
  approvals: Approval[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    branches: [],
    campaigns: [],
    images: [],
    contents: [],
    versions: [],
    comments: [],
    approvals: []
  };

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(fileContent);
        return;
      } catch (err) {
        console.error('Error reading database file. Re-initializing...', err);
      }
    }

    // Seed default database
    this.seedDatabase();
    this.save();
  }

  private seedDatabase() {
    // 1. Branches
    const branches: Branch[] = [
      { id: 'b-naco', name: 'Amerident Naco', address: 'Av. Tiradentes No. 42, Naco, Santo Domingo', phone: '809-567-8899', schedule: 'L-V: 8:00 AM - 8:00 PM, S: 8:00 AM - 4:00 PM', services: ['Odontología General', 'Ortodoncia', 'Implantología', 'Estética Dental'], active: true },
      { id: 'b-kids', name: 'Amerikids', address: 'Av. Abraham Lincoln No. 1002, Santo Domingo', phone: '809-567-9911', schedule: 'L-V: 9:00 AM - 7:00 PM, S: 9:00 AM - 5:00 PM', services: ['Odontopediatría', 'Ortodoncia Preventiva', 'Prevención Infantil'], active: true },
      { id: 'b-lincoln', name: 'Amerident Lincoln', address: 'Av. Abraham Lincoln No. 1004, Piantini, Santo Domingo', phone: '809-567-2233', schedule: 'L-V: 8:00 AM - 9:00 PM, S: 8:00 AM - 6:00 PM', services: ['Rehabilitación Oral', 'Cirugía Maxilofacial', 'Endodoncia', 'Periodoncia'], active: true },
      { id: 'b-forum', name: 'Amerident Forum', address: 'Plaza Forum, 2do Nivel, Av. 27 de Febrero, Santo Domingo', phone: '809-224-5566', schedule: 'L-D: 9:00 AM - 9:00 PM', services: ['Odontología General', 'Estética Dental', 'Blanqueamiento'], active: true },
      { id: 'b-sv', name: 'Amerident San Vicente', address: 'Av. San Vicente de Paul No. 55, Santo Domingo Este', phone: '809-788-3344', schedule: 'L-V: 8:00 AM - 7:00 PM, S: 8:00 AM - 2:00 PM', services: ['Odontología General', 'Ortodoncia', 'Prótesis'], active: true },
      { id: 'b-ozama', name: 'Amerident Ozama', address: 'Av. Sabana Larga No. 12, Ensanche Ozama', phone: '809-594-8833', schedule: 'L-V: 8:00 AM - 7:00 PM, S: 8:00 AM - 4:00 PM', services: ['Odontología General', 'Endodoncia', 'Periodoncia'], active: true },
      { id: 'b-proceres', name: 'Amerident Los Próceres', address: 'Av. Los Próceres, Plaza Diamond, Santo Domingo', phone: '809-334-1122', schedule: 'L-V: 8:00 AM - 8:00 PM, S: 8:00 AM - 4:00 PM', services: ['Odontología General', 'Ortodoncia', 'Odontopediatría'], active: true },
      { id: 'b-bonao', name: 'Amerident Bonao', address: 'Calle Duarte No. 104, Bonao', phone: '809-525-4455', schedule: 'L-V: 8:30 AM - 6:30 PM, S: 8:30 AM - 2:00 PM', services: ['Odontología General', 'Ortodoncia', 'Prótesis'], active: true },
      { id: 'b-santiago', name: 'Amerident Santiago', address: 'Av. Juan Pablo Duarte, Plaza Palma Real, Santiago', phone: '809-583-0099', schedule: 'L-V: 8:00 AM - 8:00 PM, S: 8:00 AM - 4:00 PM', services: ['Implantología', 'Estética Dental', 'Rehabilitación Oral', 'Cirugía Oral'], active: true },
    ];

    // Helper to generate salt and hash synchronously
    const salt = bcrypt.genSaltSync(10);
    
    // 2. Users
    const users: User[] = [
      { id: 'u-admin', name: 'Dra. Patricia Ortiz', email: 'admin@amerident.com', passwordHash: bcrypt.hashSync('admin123', salt), role: 'Admin', branchIds: [], avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-mkt', name: 'Marcos Peña', email: 'marketing@amerident.com', passwordHash: bcrypt.hashSync('marketing123', salt), role: 'Marketing', branchIds: [], avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-design', name: 'Lucía Méndez', email: 'designer@amerident.com', passwordHash: bcrypt.hashSync('designer123', salt), role: 'Diseñador', branchIds: [], avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-writer', name: 'Sebastián Ruiz', email: 'writer@amerident.com', passwordHash: bcrypt.hashSync('writer123', salt), role: 'Redactor', branchIds: [], avatar: 'https://images.unsplash.com/photo-1390702?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-dentist', name: 'Dr. Alejandro Gomez', email: 'dentist@amerident.com', passwordHash: bcrypt.hashSync('dentist123', salt), role: 'Odontólogo revisor', branchIds: [], avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-approver', name: 'Lic. Laura Castillo', email: 'approver@amerident.com', passwordHash: bcrypt.hashSync('approver123', salt), role: 'Aprobador', branchIds: [], avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
      { id: 'u-manager', name: 'Ing. Carlos Reyes', email: 'manager@amerident.com', passwordHash: bcrypt.hashSync('manager123', salt), role: 'Gerente de sucursal', branchIds: ['b-naco', 'b-kids'], avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', createdAt: new Date().toISOString() },
    ];

    // 3. Campaigns
    const campaigns: Campaign[] = [
      {
        id: 'c-sonrisas-sanas',
        name: 'Sonrisas Sanas 2026',
        objective: 'Promover la prevención y limpieza dental anual para familias completas.',
        audience: 'Familias',
        specialty: 'Odontología general',
        treatment: 'Limpieza dental',
        branchIds: ['b-naco', 'b-lincoln', 'b-forum', 'b-santiago'],
        channels: ['Instagram', 'Facebook', 'Correo electrónico'],
        status: 'En preparación',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        budget: 5000,
        responsibleId: 'u-mkt',
        kpis: ['150 Citas agendadas', 'Alcance de 50,000 personas en IG', 'Tasa de apertura de correo > 25%'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'c-orto-invisible',
        name: 'Ortodoncia Invisible Amerident',
        objective: 'Atraer a jóvenes profesionales interesados en mejorar su sonrisa con brackets invisibles (Alineadores).',
        audience: 'Adultos',
        specialty: 'Ortodoncia',
        treatment: 'Alineadores invisibles',
        branchIds: ['b-naco', 'b-lincoln', 'b-santiago'],
        channels: ['Instagram', 'LinkedIn', 'Publicidad digital'],
        status: 'Idea',
        startDate: '2026-09-01',
        endDate: '2026-11-30',
        budget: 12000,
        responsibleId: 'u-mkt',
        kpis: ['60 Casos iniciados', 'Costo por lead < $15 USD', '10,000 clics en página web'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'c-turismo-dental',
        name: 'Turismo Dental República Dominicana',
        objective: 'Posicionar a Amerident como líder en tratamientos de alta complejidad (implantes, carillas) para pacientes norteamericanos.',
        audience: 'Pacientes internacionales',
        specialty: 'Estética dental',
        treatment: 'Carillas y Coronas',
        branchIds: ['b-naco', 'b-lincoln'],
        channels: ['Banner web', 'Correo electrónico', 'Google Ads'],
        status: 'Aprobada',
        startDate: '2026-07-20',
        endDate: '2026-10-20',
        budget: 25000,
        responsibleId: 'u-mkt',
        kpis: ['25 Pacientes extranjeros cerrados', 'ROI de campaña > 300%', 'Aumento de visitas a sección internacional'],
        createdAt: new Date().toISOString()
      },
      {
        id: 'c-amerikids-clases',
        name: 'Amerikids Regreso a Clases',
        objective: 'Fomentar la revisión dental infantil y sellantes preventivos antes del inicio del año escolar.',
        audience: 'Padres',
        specialty: 'Odontopediatría',
        treatment: 'Sellantes y flúor',
        branchIds: ['b-kids'],
        channels: ['Instagram', 'WhatsApp', 'Pantalla de clínica'],
        status: 'Programada',
        startDate: '2026-08-10',
        endDate: '2026-09-10',
        budget: 3500,
        responsibleId: 'u-mkt',
        kpis: ['100 Niños atendidos', '500 Mensajes de WhatsApp enviados', 'Conversión del 30% en base de datos'],
        createdAt: new Date().toISOString()
      }
    ];

    // 4. Content Documents
    const contents: ContentDocument[] = [
      {
        id: 'doc-1',
        title: 'Post IG - Brackets Invisibles Profesionales',
        contentType: 'Publicación para Instagram',
        campaignId: 'c-orto-invisible',
        branchIds: ['b-naco', 'b-lincoln'],
        specialty: 'Ortodoncia',
        treatment: 'Alineadores invisibles',
        audience: 'Adultos',
        channel: 'Instagram',
        tone: 'Premium',
        originalContent: '¿Trabajas con público y te da pena usar brackets tradicionales? Conoce los alineadores invisibles de Amerident. Son cómodos, removibles y nadie sabrá que los llevas puestos. Agenda tu cita de evaluación hoy.',
        currentContent: '¿Sientes que tu sonrisa no refleja tu profesionalismo? ✨ Descubre la comodidad de los Alineadores Invisibles de Amerident. Una tecnología avanzada diseñada para alinear tus dientes de manera discreta, cómoda y sin interrumpir tu ritmo laboral. \n\n🔒 Invisibles, removibles y adaptados a ti. \n\nAgenda hoy tu evaluación de estética dental en Amerident Naco o Lincoln y proyecta la seguridad que mereces. ¡Escríbenos por DM! 📲',
        status: 'Revisión clínica',
        createdBy: 'u-writer',
        createdByName: 'Sebastián Ruiz',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'doc-2',
        title: 'WhatsApp Masivo - Prevención Escolar Amerikids',
        contentType: 'Mensaje de WhatsApp',
        campaignId: 'c-amerikids-clases',
        branchIds: ['b-kids'],
        specialty: 'Odontopediatría',
        treatment: 'Sellantes y flúor',
        audience: 'Padres',
        channel: 'WhatsApp',
        tone: 'Familiar',
        originalContent: 'Hola, recuerda traer a tu hijo a su revisión dental para el regreso a clases. Evita dolores y ausencias escolares. Llama hoy.',
        currentContent: '🎒 ¡Lista escolar completa! Cuadernos, lápices y... ¡una sonrisa sana! 🦷✨ \n\nMamá y papá: antes de iniciar las clases, regálales la seguridad de una boca sana. En *Amerikids* hemos preparado un plan preventivo especial de sellantes y flúor que protege sus dientes contra las caries y evita molestias en el año escolar. \n\n📅 Agenda su cita de manera rápida haciendo clic aquí: [Enlace de Contacto] o escríbenos directamente. ¡Te esperamos en nuestra sucursal exclusiva Amerikids!',
        status: 'Aprobado',
        createdBy: 'u-writer',
        createdByName: 'Sebastián Ruiz',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
      },
      {
        id: 'doc-3',
        title: 'Instrucciones Post-Operatorias Implantes',
        contentType: 'Descripción de tratamiento',
        campaignId: 'c-turismo-dental',
        branchIds: ['b-naco', 'b-lincoln', 'b-santiago'],
        specialty: 'Implantología',
        treatment: 'Implantes dentales',
        audience: 'Adultos',
        channel: 'Correo electrónico',
        tone: 'Tranquilizador',
        originalContent: '1. No escupir ni enjuagarse. 2. Ponerse hielo por fuera. 3. Tomar sus pastillas analgésicas. 4. Dieta blanda.',
        currentContent: '🦷 **Guía de Cuidados Posteriores a tu Colocación de Implante Dental Amerident**\n\nQuerido paciente: tu bienestar es nuestra prioridad. Para asegurar una cicatrización perfecta y sin molestias, por favor sigue con atención estas indicaciones durante las próximas 48 horas:\n\n1.❄️ **Aplicación de Frío:** Coloca una compresa fría en la zona externa de la mejilla durante 15 minutos, con intervalos de descanso de 15 minutos. Esto reducirá cualquier inflamación.\n2.💧 **Evita Enjuagues Fuertes:** No te enjuagues la boca ni escupas con fuerza hoy. Deja que los líquidos salgan con suavidad. Mañana podrás realizar enjuagues muy suaves con agua tibia y sal.\n3.🍲 **Nutrición Suave:** Mantén una dieta líquida o blanda a temperatura ambiente o fría (purés, batidos, gelatinas). Evita alimentos calientes, picantes o crujientes.\n4.💊 **Medicamentos:** Toma puntualmente los analgésicos y antibióticos recetados por tu cirujano de Amerident.\n\n*Nota Importante:* La IA generó esta guía informativa. Cualquier dolor agudo o sangrado abundante debe notificarse de inmediato a tu especialista de cabecera.',
        status: 'Restaura versión',
        createdBy: 'u-writer',
        createdByName: 'Sebastián Ruiz',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];

    // 5. Content Versions
    const versions: ContentVersion[] = [
      { id: 'v-1', documentId: 'doc-1', content: '¿Trabajas con público y te da pena usar brackets tradicionales? Conoce los alineadores invisibles de Amerident. Son cómodos, removibles y nadie sabrá que los llevas puestos. Agenda tu cita de evaluación hoy.', action: 'Creado', versionNumber: 1, authorId: 'u-writer', authorName: 'Sebastián Ruiz', createdAt: new Date(Date.now() - 3600000 * 24).toISOString() },
      { id: 'v-2', documentId: 'doc-1', content: '¿Sientes que tu sonrisa no refleja tu profesionalismo? ✨ Descubre la comodidad de los Alineadores Invisibles de Amerident. Una tecnología avanzada diseñada para alinear tus dientes de manera discreta, cómoda y sin interrumpir tu ritmo laboral. \n\n🔒 Invisibles, removibles y adaptados a ti. \n\nAgenda hoy tu evaluación de estética dental en Amerident Naco o Lincoln y proyecta la seguridad que mereces. ¡Escríbenos por DM! 📲', action: 'Edición de IA', versionNumber: 2, authorId: 'u-mkt', authorName: 'Marcos Peña', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'v-3', documentId: 'doc-2', content: 'Hola, recuerda traer a tu hijo a su revisión dental para el regreso a clases. Evita dolores y ausencias escolares. Llama hoy.', action: 'Creado', versionNumber: 1, authorId: 'u-writer', authorName: 'Sebastián Ruiz', createdAt: new Date(Date.now() - 3600000 * 12).toISOString() },
      { id: 'v-4', documentId: 'doc-2', content: '🎒 ¡Lista escolar completa! Cuadernos, lápices y... ¡una sonrisa sana! 🦷✨ \n\nMamá y papá: antes de iniciar las clases, regálales la seguridad de una boca sana. En *Amerikids* hemos preparado un plan preventivo especial de sellantes y flúor que protege sus dientes contra las caries y evita molestias en el año escolar. \n\n📅 Agenda su cita de manera rápida haciendo clic aquí: [Enlace de Contacto] o escríbenos directamente. ¡Te esperamos en nuestra sucursal exclusiva Amerikids!', action: 'Edición de IA', versionNumber: 2, authorId: 'u-writer', authorName: 'Sebastián Ruiz', createdAt: new Date(Date.now() - 3600000 * 6).toISOString() }
    ];

    // 6. Comments
    const comments: Comment[] = [
      { id: 'com-1', resourceType: 'content', resourceId: 'doc-1', userId: 'u-dentist', userName: 'Dr. Alejandro Gomez', userRole: 'Odontólogo revisor', message: 'Por favor, asegúrate de mencionar que el tratamiento con alineadores invisibles requiere una previa evaluación radiográfica de salud de las encías y hueso. No podemos prometer resultados sin diagnóstico previo.', resolved: false, createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
      { id: 'com-2', resourceType: 'content', resourceId: 'doc-2', userId: 'u-approver', userName: 'Lic. Laura Castillo', userRole: 'Aprobador', message: '¡Excelente tono cercano! El texto cumple con las normas de branding y el eslogan de Amerikids.', resolved: true, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() }
    ];

    // 7. Approvals
    const approvals: Approval[] = [
      { id: 'app-1', resourceType: 'content', resourceId: 'doc-2', stage: 'Revisión de marca', reviewerId: 'u-approver', reviewerName: 'Lic. Laura Castillo', reviewerRole: 'Aprobador', status: 'Aprobado', observations: 'Cumple a la perfección con la identidad corporativa.', createdAt: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 'app-2', resourceType: 'content', resourceId: 'doc-1', stage: 'Revisión clínica', reviewerId: 'u-dentist', reviewerName: 'Dr. Alejandro Gomez', reviewerRole: 'Odontólogo revisor', status: 'Cambios solicitados', observations: 'Falta advertencia de salud periodontal y evaluación radiográfica.', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
    ];

    // 8. Generated Images (Predefined Stock Mockups for Demo Mode)
    // Curated high quality dentist / clinic images from Unsplash
    const images: GeneratedImage[] = [
      {
        id: 'img-1',
        campaignId: 'c-sonrisas-sanas',
        branchIds: ['b-naco'],
        userId: 'u-design',
        userName: 'Lucía Méndez',
        prompt: 'A happy family smiling, showing perfect white teeth, clean modern bright dental clinic background, warm professional lighting, photography style --ar 1:1',
        negativePrompt: 'braces, cavities, blood, tools, operating room, dark lighting',
        style: 'Fotografía publicitaria',
        format: 'Instagram 1:1',
        fileUrl: 'https://images.unsplash.com/photo-1484665754804-74b091211472?w=600&auto=format&fit=crop&q=80',
        model: 'Stable Diffusion XL',
        moderationStatus: 'Aprobado',
        approvalStatus: 'Aprobado',
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
      },
      {
        id: 'img-2',
        campaignId: 'c-amerikids-clases',
        branchIds: ['b-kids'],
        userId: 'u-design',
        userName: 'Lucía Méndez',
        prompt: 'A cute little child smiling happily showing healthy teeth, holding a giant toothbrush, colorful dentist room, playful and educational cartoonish-photorealistic mix --ar 4:5',
        style: 'Infantil',
        format: 'Instagram vertical 4:5',
        fileUrl: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
        model: 'Stable Diffusion XL',
        moderationStatus: 'Aprobado',
        approvalStatus: 'Aprobado',
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
      },
      {
        id: 'img-3',
        campaignId: 'c-turismo-dental',
        branchIds: ['b-naco', 'b-lincoln'],
        userId: 'u-design',
        userName: 'Lucía Méndez',
        prompt: 'Luxury dental office overlooking the Caribbean sea, turquoise water, warm tropical sunlight, minimalist white aesthetic, high-end dentist chair, premium commercial edit --ar 16:9',
        style: 'Premium',
        format: 'Banner web',
        fileUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
        model: 'Stable Diffusion XL',
        moderationStatus: 'Aprobado',
        approvalStatus: 'En revisión',
        version: 1,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      }
    ];

    this.db = {
      users,
      branches,
      campaigns,
      images,
      contents,
      versions,
      comments,
      approvals
    };
  }

  // Getters
  get users(): User[] { return this.db.users; }
  get branches(): Branch[] { return this.db.branches; }
  get campaigns(): Campaign[] { return this.db.campaigns; }
  get images(): GeneratedImage[] { return this.db.images; }
  get contents(): ContentDocument[] { return this.db.contents; }
  get versions(): ContentVersion[] { return this.db.versions; }
  get comments(): Comment[] { return this.db.comments; }
  get approvals(): Approval[] { return this.db.approvals; }

  // Save changes to db.json
  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file', err);
    }
  }

  // Helper inserts/updates
  public insertUser(user: User) {
    this.db.users.push(user);
    this.save();
    return user;
  }

  public insertBranch(branch: Branch) {
    this.db.branches.push(branch);
    this.save();
    return branch;
  }

  public insertCampaign(campaign: Campaign) {
    this.db.campaigns.push(campaign);
    this.save();
    return campaign;
  }

  public updateCampaign(campaignId: string, updates: Partial<Campaign>) {
    const idx = this.db.campaigns.findIndex(c => c.id === campaignId);
    if (idx !== -1) {
      this.db.campaigns[idx] = { ...this.db.campaigns[idx], ...updates };
      this.save();
      return this.db.campaigns[idx];
    }
    return null;
  }

  public deleteCampaign(campaignId: string) {
    this.db.campaigns = this.db.campaigns.filter(c => c.id !== campaignId);
    this.save();
  }

  public insertImage(img: GeneratedImage) {
    this.db.images.push(img);
    this.save();
    return img;
  }

  public deleteImage(id: string) {
    this.db.images = this.db.images.filter(img => img.id !== id);
    this.save();
  }

  public insertContent(doc: ContentDocument) {
    this.db.contents.push(doc);
    this.save();
    return doc;
  }

  public updateContent(id: string, updates: Partial<ContentDocument>) {
    const idx = this.db.contents.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.db.contents[idx] = { ...this.db.contents[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.db.contents[idx];
    }
    return null;
  }

  public insertVersion(ver: ContentVersion) {
    this.db.versions.push(ver);
    this.save();
    return ver;
  }

  public insertComment(com: Comment) {
    this.db.comments.push(com);
    this.save();
    return com;
  }

  public updateComment(id: string, updates: Partial<Comment>) {
    const idx = this.db.comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.db.comments[idx] = { ...this.db.comments[idx], ...updates };
      this.save();
      return this.db.comments[idx];
    }
    return null;
  }

  public insertApproval(app: Approval) {
    this.db.approvals.push(app);
    this.save();
    return app;
  }
}

export const dbService = new DatabaseService();
