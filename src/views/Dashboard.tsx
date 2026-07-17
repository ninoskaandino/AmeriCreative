import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';

interface DashboardProps {
  user: any;
  setView: (view: string) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, setView, showToast }) => {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    pendingApprovals: 0,
    generatedImages: 0,
    generatedTexts: 0,
  });
  const [pendingDocs, setPendingDocs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [campaigns, images, contents, branchesList] = await Promise.all([
        api.campaigns.getAll(),
        api.images.getAll(),
        api.content.getAll(),
        api.branches.getAll()
      ]);

      setBranches(branchesList);

      // Compute statistics
      const activeCamps = campaigns.filter(c => c.status === 'Idea' || c.status === 'En preparación' || c.status === 'En revisión' || c.status === 'Aprobada' || c.status === 'Programada' || c.status === 'Publicada');
      const pendingContent = contents.filter(c => c.status !== 'Aprobado' && c.status !== 'Programado' && c.status !== 'Publicado');
      const pendingImages = images.filter(img => img.approvalStatus === 'En revisión');
      
      setStats({
        activeCampaigns: activeCamps.length,
        pendingApprovals: pendingContent.length + pendingImages.length,
        generatedImages: images.length,
        generatedTexts: contents.length,
      });

      // Filter pending approval items
      setPendingDocs(contents.filter(c => c.status.startsWith('Revisión')));

      // Build simulated activity log based on items
      const logs = [
        ...contents.map(c => ({ id: c.id, type: 'content', title: c.title, user: c.createdByName, action: 'creó el texto', date: c.createdAt })),
        ...images.map(img => ({ id: img.id, type: 'image', title: img.prompt.substring(0, 40) + '...', user: img.userName || 'Diseñador', action: 'generó la imagen', date: img.createdAt })),
      ];
      // Sort logs by date descending
      logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(logs.slice(0, 5));

    } catch (err: any) {
      showToast('Error al cargar la información del panel.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickApprove = async (docId: string) => {
    try {
      await api.approvals.approve('content', docId, 'Aprobación rápida desde panel principal.');
      showToast('Contenido aprobado y avanzado de fase.', 'success');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message || 'Error al aprobar.', 'error');
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Panel Principal</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Bienvenido(a), <strong style={{ color: 'var(--primary)' }}>{user.name}</strong> ({user.role})
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
          🔄 Actualizar
        </button>
      </div>

      {/* Stats row */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <div className="stat-num">{stats.activeCampaigns}</div>
            <div className="stat-label">Campañas Activas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <div className="stat-num">{stats.pendingApprovals}</div>
            <div className="stat-label">Tareas de Aprobación</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div>
            <div className="stat-num">{stats.generatedImages}</div>
            <div className="stat-label">Imágenes Creadas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon accent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <div className="stat-num">{stats.generatedTexts}</div>
            <div className="stat-label">Copys de Redacción</div>
          </div>
        </div>
      </div>

      {/* Quick access grid */}
      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.25rem' }}>Accesos Rápidos</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        <div className="card" onClick={() => setView('redactor')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary-bg)', color: 'var(--secondary)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Redactar Publicación</span>
        </div>

        <div className="card" onClick={() => setView('images')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Generar Imagen IA</span>
        </div>

        <div className="card" onClick={() => setView('campaigns')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Crear Campaña</span>
        </div>

        <div className="card" onClick={() => setView('branches')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textAlign: 'center', padding: '1.25rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '50%', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>Ver Sucursales</span>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Activity */}
      <div className="dashboard-grid">
        {/* Pending approvals */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 className="card-title">📝 Contenidos Pendientes de Aprobación</h3>
          {pendingDocs.length === 0 ? (
            <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem' }}>
              No hay textos en espera de revisión clínica o de marca actualmente. ¡Buen trabajo!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left', color: 'var(--gray-600)' }}>
                    <th style={{ padding: '0.5rem' }}>Título</th>
                    <th style={{ padding: '0.5rem' }}>Especialidad</th>
                    <th style={{ padding: '0.5rem' }}>Fase</th>
                    <th style={{ padding: '0.5rem' }}>Creado por</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDocs.map(doc => {
                    const showApprove = 
                      (doc.status === 'Revisión clínica' && (user.role === 'Odontólogo revisor' || user.role === 'Admin')) ||
                      (doc.status === 'Revisión de marca' && (user.role === 'Aprobador' || user.role === 'Admin')) ||
                      (doc.status === 'Revisión de marketing' && (user.role === 'Marketing' || user.role === 'Admin'));

                    return (
                      <tr key={doc.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{doc.title}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>{doc.specialty}</td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span className={`badge ${
                            doc.status === 'Revisión clínica' ? 'badge-clinical' : 'badge-review'
                          }`}>{doc.status}</span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: 'var(--gray-500)' }}>{doc.createdByName}</td>
                        <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                          {showApprove ? (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => handleQuickApprove(doc.id)}
                            >
                              Aprobar
                            </button>
                          ) : (
                            <button 
                              className="btn btn-secondary btn-sm" 
                              onClick={() => setView('redactor')}
                            >
                              Ver
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <h3 className="card-title">🔔 Actividad Reciente</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {recentActivity.map(act => (
              <div key={act.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.85rem', borderBottom: '1px solid var(--gray-100)', paddingBottom: '0.75rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: act.type === 'content' ? 'var(--secondary-bg)' : 'var(--success-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: act.type === 'content' ? 'var(--secondary)' : 'var(--success)',
                  flexShrink: 0
                }}>
                  {act.type === 'content' ? '📝' : '🎨'}
                </div>
                <div>
                  <div>
                    <strong>{act.user}</strong> {act.action}
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{act.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                    {new Date(act.date).toLocaleDateString()} {new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
