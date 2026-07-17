import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Modal } from '../components/Modal.js';

interface GalleryProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const Gallery: React.FC<GalleryProps> = ({ user, showToast }) => {
  const [images, setImages] = useState<any[]>([]);
  const [contents, setContents] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // Filter variables
  const [mediaType, setMediaType] = useState<'all' | 'images' | 'texts'>('all');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Modal details
  const [activeContentDoc, setActiveContentDoc] = useState<any | null>(null);

  useEffect(() => {
    loadGallery();
    api.branches.getAll().then(setBranches).catch(() => {});
    api.campaigns.getAll().then(setCampaigns).catch(() => {});
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const [imgList, txtList] = await Promise.all([
        api.images.getAll(),
        api.content.getAll()
      ]);
      setImages(imgList);
      setContents(txtList);
    } catch (err) {
      showToast('Error al cargar la galería.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Texto copiado al portapapeles.', 'success');
  };

  // Compile and filter items
  const filteredImages = images.filter(img => {
    if (selectedBranch && !img.branchIds.includes(selectedBranch)) return false;
    if (selectedCampaign && img.campaignId !== selectedCampaign) return false;
    if (selectedSpecialty && !img.style.toLowerCase().includes(selectedSpecialty.toLowerCase())) return false;
    if (searchQuery && !img.prompt.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredContents = contents.filter(doc => {
    if (selectedBranch && !doc.branchIds.includes(selectedBranch)) return false;
    if (selectedCampaign && doc.campaignId !== selectedCampaign) return false;
    if (selectedSpecialty && doc.specialty.toLowerCase() !== selectedSpecialty.toLowerCase()) return false;
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) && !doc.currentContent.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Galería de Contenidos</h2>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
            Explora la biblioteca de copys redactados e imágenes odontológicas creadas para toda la red Amerident.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadGallery} disabled={loading}>
          🔄 Refrescar
        </button>
      </div>

      {/* Filter panel */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)' }}>Tipo de Material</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                className={`btn btn-sm ${mediaType === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMediaType('all')}
              >
                Todos
              </button>
              <button 
                className={`btn btn-sm ${mediaType === 'images' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMediaType('images')}
              >
                Imágenes
              </button>
              <button 
                className={`btn btn-sm ${mediaType === 'texts' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMediaType('texts')}
              >
                Copys
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)' }}>Búsqueda</span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por prompt, título..."
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)' }}>Sucursal</span>
            <select 
              className="form-control" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">Todas</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)' }}>Campaña</span>
            <select 
              className="form-control" 
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
            >
              <option value="">Todas</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <div>
          {/* Images Section */}
          {(mediaType === 'all' || mediaType === 'images') && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                🎨 Piezas Visuales ({filteredImages.length})
              </h3>
              {filteredImages.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>No se encontraron imágenes con los filtros seleccionados.</p>
              ) : (
                <div className="gallery-grid">
                  {filteredImages.map(img => (
                    <div key={img.id} className="gallery-card">
                      <div className="gallery-card-media">
                        <img src={img.fileUrl} className="gallery-card-img" />
                        <div className="ia-watermark">IA</div>
                      </div>
                      <div className="gallery-card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span className="badge badge-draft" style={{ fontSize: '0.65rem' }}>{img.format}</span>
                          <span className={`badge ${
                            img.approvalStatus === 'Aprobado' ? 'badge-approved' : 'badge-review'
                          }`} style={{ fontSize: '0.65rem' }}>{img.approvalStatus}</span>
                        </div>
                        <div className="gallery-card-desc">
                          <strong>Prompt:</strong> {img.prompt}
                        </div>
                        <div className="gallery-card-footer">
                          <span>Autor: {img.userName}</span>
                          <a href={img.fileUrl} target="_blank" download className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                            📥 Descargar
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Texts Section */}
          {(mediaType === 'all' || mediaType === 'texts') && (
            <div>
              <h3 style={{ borderBottom: '1px solid var(--gray-200)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                📝 Copys e Instrucciones ({filteredContents.length})
              </h3>
              {filteredContents.length === 0 ? (
                <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>No se encontraron copys con los filtros seleccionados.</p>
              ) : (
                <div className="gallery-grid">
                  {filteredContents.map(doc => (
                    <div key={doc.id} className="gallery-card" style={{ display: 'flex', flexDirection: 'column', height: '220px' }}>
                      <div className="gallery-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span className="badge badge-review" style={{ fontSize: '0.65rem' }}>{doc.channel}</span>
                            <span className="badge badge-approved" style={{ fontSize: '0.65rem' }}>{doc.status}</span>
                          </div>
                          <div className="gallery-card-title">{doc.title}</div>
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: 'var(--gray-600)',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {doc.currentContent}
                          </p>
                        </div>

                        <div className="gallery-card-footer">
                          <span>Autor: {doc.createdByName}</span>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                            onClick={() => setActiveContentDoc(doc)}
                          >
                            🔎 Ver Completo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Copy Viewer Modal */}
      {activeContentDoc && (
        <Modal 
          isOpen={!!activeContentDoc} 
          onClose={() => setActiveContentDoc(null)} 
          title={activeContentDoc.title}
          footerButtons={
            <>
              <button className="btn btn-secondary" onClick={() => setActiveContentDoc(null)}>Cerrar</button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleCopyToClipboard(activeContentDoc.currentContent)}
              >
                📋 Copiar Texto
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div><strong>Especialidad:</strong> {activeContentDoc.specialty}</div>
            <div><strong>Tratamiento:</strong> {activeContentDoc.treatment}</div>
            <div><strong>Público:</strong> {activeContentDoc.audience}</div>
            <div><strong>Tono:</strong> {activeContentDoc.tone}</div>
          </div>
          
          <div style={{ 
            backgroundColor: 'var(--gray-50)', 
            border: '1px solid var(--gray-200)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)', 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'var(--font-sans)', 
            lineHeight: 1.6,
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {activeContentDoc.currentContent}
          </div>
        </Modal>
      )}

    </div>
  );
};
