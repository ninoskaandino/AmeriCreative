import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Modal } from '../components/Modal.js';

interface BranchManagerProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({ user, showToast }) => {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);

  // Edit fields
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [schedule, setSchedule] = useState('');
  const [services, setServices] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const list = await api.branches.getAll();
      setBranches(list);
    } catch (err) {
      showToast('Error al cargar sucursales.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (branch: any) => {
    setSelectedBranch(branch);
    setAddress(branch.address);
    setPhone(branch.phone);
    setSchedule(branch.schedule);
    setServices(branch.services.join(', '));
    setActive(branch.active);
    setIsModalOpen(true);
  };

  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      await api.branches.update(selectedBranch.id, {
        address,
        phone,
        schedule,
        services: services.split(',').map(s => s.trim()).filter(s => s),
        active
      });

      showToast('Sucursal actualizada exitosamente.', 'success');
      setIsModalOpen(false);
      loadBranches();
    } catch (err: any) {
      showToast(err.message || 'Error al actualizar sucursal.', 'error');
    }
  };

  // Determine editing rights: Admin can edit any; Branch manager can edit only their branchIds
  const canEdit = (branchId: string) => {
    if (user.role === 'Admin') return true;
    if (user.role === 'Gerente de sucursal' && user.branchIds.includes(branchId)) return true;
    return false;
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Catálogo de Sucursales Amerident</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          Personaliza la información de contacto, horarios y servicios disponibles en cada clínica de nuestra red.
        </p>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div className="branch-grid">
          {branches.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.2rem' }}>{b.name}</h3>
                  <span className={`badge ${b.active ? 'badge-approved' : 'badge-draft'}`}>
                    {b.active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                  📍 {b.address}
                </p>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <strong>📞 Teléfono:</strong> {b.phone}
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  <strong>⏰ Horarios:</strong> {b.schedule}
                </div>

                <div style={{ borderTop: '1px solid var(--gray-100)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'block', marginBottom: '0.25rem' }}>
                    Servicios Especializados:
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {b.services.map((s: string, idx: number) => (
                      <span key={idx} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--gray-100)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {canEdit(b.id) && (
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: '1.5rem', width: '100%' }}
                  onClick={() => handleEditClick(b)}
                >
                  ✏️ Modificar Datos
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Editing Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={selectedBranch ? `Modificar Datos de ${selectedBranch.name}` : ''}
        footerButtons={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleUpdateBranch}>Guardar Cambios</button>
          </>
        }
      >
        <form onSubmit={handleUpdateBranch}>
          <div className="form-group">
            <label className="form-label">Dirección física</label>
            <input 
              type="text" 
              className="form-control" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Teléfono de contacto</label>
              <input 
                type="text" 
                className="form-control" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Horarios de atención</label>
              <input 
                type="text" 
                className="form-control" 
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Servicios (Separados por coma)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Odontología General, Ortodoncia, Periodoncia"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Sucursal Activa en la red
            </label>
          </div>
        </form>
      </Modal>
    </div>
  );
};
