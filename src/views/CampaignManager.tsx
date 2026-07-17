import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Modal } from '../components/Modal.js';

interface CampaignManagerProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SPECIALTIES = [
  'Odontología general', 'Odontopediatría', 'Ortodoncia', 'Endodoncia', 
  'Periodoncia', 'Cirugía oral', 'Prótesis', 'Implantología', 'Estética dental', 'Rehabilitación oral'
];

const AUDIENCES = [
  'Niños', 'Adolescentes', 'Adultos', 'Adultos mayores', 'Padres', 
  'Pacientes internacionales', 'Pacientes con seguros', 'Empresas', 'Familias'
];

export const CampaignManager: React.FC<CampaignManagerProps> = ({ user, showToast }) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [assets, setAssets] = useState<{ images: any[]; contents: any[] }>({ images: [], contents: [] });
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [audience, setAudience] = useState(AUDIENCES[2]);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [treatment, setTreatment] = useState('');
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [kpis, setKpis] = useState('');
  const [channels, setChannels] = useState<string[]>(['Instagram']);

  useEffect(() => {
    loadCampaigns();
    api.branches.getAll().then(setBranches).catch(() => {});
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const list = await api.campaigns.getAll();
      setCampaigns(list);
      if (selectedCampaign) {
        // Refresh details
        handleSelectCampaign(selectedCampaign.id);
      }
    } catch (err) {
      showToast('Error al cargar las campañas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (id: string) => {
    try {
      const res = await api.campaigns.getById(id);
      setSelectedCampaign(res.campaign);
      setAssets(res.assets);
    } catch (err) {
      showToast('Error al obtener detalles de la campaña.', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.campaigns.create({
        name,
        objective,
        audience,
        specialty,
        treatment,
        budget,
        startDate,
        endDate,
        branchIds: selectedBranchIds,
        channels,
        kpis: kpis.split('\n').filter(k => k.trim())
      });

      showToast('Campaña creada con éxito.', 'success');
      setIsModalOpen(false);
      loadCampaigns();
      // Reset form
      setName('');
      setObjective('');
      setTreatment('');
      setBudget(0);
      setKpis('');
    } catch (err) {
      showToast('Error al crear campaña.', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta campaña?')) return;
    try {
      await api.campaigns.delete(id);
      showToast('Campaña eliminada.', 'success');
      setSelectedCampaign(null);
      loadCampaigns();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar campaña.', 'error');
    }
  };

  const isMktOrAdmin = user.role === 'Marketing' || user.role === 'Admin';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Campañas de Marketing</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Planifica e integra los recursos audiovisuales y copys dentro del calendario publicitario de Amerident.
          </p>
        </div>
        {isMktOrAdmin && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            ➕ Nueva Campaña
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        {/* Left column: list of campaigns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>Registro de Campañas</h3>
            {loading && campaigns.length === 0 ? (
              <div className="spinner"></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '500px', overflowY: 'auto' }}>
                {campaigns.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => handleSelectCampaign(c.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: selectedCampaign?.id === c.id ? 'var(--primary-bg)' : 'var(--white)',
                      border: `1px solid ${selectedCampaign?.id === c.id ? 'var(--primary)' : 'var(--gray-200)'}`,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{c.name}</strong>
                      <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                      Especialidad: {c.specialty}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '4px' }}>
                      Plazo: {c.startDate} al {c.endDate}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Campaign Details & Assets */}
        <div>
          {selectedCampaign ? (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--gray-200)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem' }}>{selectedCampaign.name}</h3>
                  <span className="badge badge-published" style={{ marginTop: '0.5rem' }}>Estado: {selectedCampaign.status}</span>
                </div>
                {isMktOrAdmin && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCampaign(selectedCampaign.id)}>
                    Eliminar Campaña
                  </button>
                )}
              </div>

              <div>
                <strong>Objetivo de la Campaña:</strong>
                <p style={{ color: 'var(--gray-700)', marginTop: '0.25rem' }}>{selectedCampaign.objective}</p>
              </div>

              <div className="form-row">
                <div>
                  <strong>Presupuesto:</strong>
                  <div style={{ color: 'var(--secondary)', fontWeight: 700, fontSize: '1.25rem' }}>
                    ${selectedCampaign.budget.toLocaleString()} USD
                  </div>
                </div>
                <div>
                  <strong>Público Objetivo:</strong>
                  <p>{selectedCampaign.audience}</p>
                </div>
                <div>
                  <strong>Especialidad / Tratamiento:</strong>
                  <p>{selectedCampaign.specialty} ({selectedCampaign.treatment})</p>
                </div>
              </div>

              {selectedCampaign.kpis && selectedCampaign.kpis.length > 0 && (
                <div>
                  <strong>Indicadores de Logro (KPIs):</strong>
                  <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                    {selectedCampaign.kpis.map((kpi: string, idx: number) => <li key={idx}>{kpi}</li>)}
                  </ul>
                </div>
              )}

              {/* Linked assets */}
              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem' }}>Materiales Asociados</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Visual assets */}
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>🎨 Piezas Visuales ({assets.images.length})</strong>
                    {assets.images.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>No hay imágenes vinculadas.</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {assets.images.map(img => (
                          <div key={img.id} style={{ border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                            <img src={img.fileUrl} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                            <div style={{ padding: '0.5rem', fontSize: '0.75rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              Format: {img.format}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Texts assets */}
                  <div>
                    <strong style={{ display: 'block', marginBottom: '0.5rem' }}>📝 Redacciones / Copys ({assets.contents.length})</strong>
                    {assets.contents.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>No hay copys de marketing vinculados.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {assets.contents.map(doc => (
                          <div key={doc.id} style={{ padding: '0.5rem', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                            <strong style={{ color: 'var(--primary)' }}>{doc.title}</strong>
                            <div style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Canal: {doc.channel}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-400)' }}>
              Selecciona una campaña de la lista para ver su presupuesto, KPI y recursos vinculados.
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Crear Nueva Campaña de Marketing"
        footerButtons={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCreateCampaign}>Crear Campaña</button>
          </>
        }
      >
        <form onSubmit={handleCreateCampaign}>
          <div className="form-group">
            <label className="form-label">Nombre de campaña</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej. Blanqueamiento Verano 2026" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Objetivo de la campaña</label>
            <textarea 
              className="form-control" 
              placeholder="Ej. Captar 80 nuevos pacientes..." 
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Especialidad</label>
              <select className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tratamiento principal</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Carillas de porcelana"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Público objetivo</label>
              <select className="form-control" value={audience} onChange={(e) => setAudience(e.target.value)}>
                {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Presupuesto (USD)</label>
              <input 
                type="number" 
                className="form-control" 
                value={budget} 
                onChange={(e) => setBudget(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha de Inicio</label>
              <input 
                type="date" 
                className="form-control" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Cierre</label>
              <input 
                type="date" 
                className="form-control" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Indicadores (KPIs) - Uno por línea</label>
            <textarea 
              className="form-control" 
              placeholder="Ej. 100 Citas agendadas&#10;50 leads cualificados"
              value={kpis}
              onChange={(e) => setKpis(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sucursales participantes (Selecciona)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', maxHeight: '120px', overflowY: 'auto' }}>
              {branches.map(b => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedBranchIds.includes(b.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBranchIds([...selectedBranchIds, b.id]);
                      } else {
                        setSelectedBranchIds(selectedBranchIds.filter(id => id !== b.id));
                      }
                    }}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
