import React, { useState, useEffect } from 'react';
import { Login } from './views/Login.js';
import { Dashboard } from './views/Dashboard.js';
import { ImageGenerator } from './views/ImageGenerator.js';
import { ContentEditor } from './views/ContentEditor.js';
import { CampaignManager } from './views/CampaignManager.js';
import { BranchManager } from './views/BranchManager.js';
import { Gallery } from './views/Gallery.js';
import { api } from './services/api.js';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', visible: false });
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  useEffect(() => {
    // Attempt auto-login if token is valid
    const token = localStorage.getItem('amerident_token');
    if (token) {
      api.auth.me()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('amerident_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('amerident_token');
    setUser(null);
    setCurrentView('dashboard');
    showToast('Sesión cerrada correctamente.', 'success');
  };

  // Demo helper: allows changing roles on the fly to review different dashboard views
  const handleRoleSwap = (roleName: string) => {
    if (!user) return;
    const nextUser = { ...user, role: roleName };
    // Pre-assign mock branches for Manager
    if (roleName === 'Gerente de sucursal') {
      nextUser.branchIds = ['b-naco', 'b-kids'];
    } else {
      nextUser.branchIds = [];
    }
    setUser(nextUser);
    showToast(`Simulando rol: ${roleName}`, 'success');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--gray-50)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLoginSuccess={(u) => {
          setUser(u);
          showToast(`¡Bienvenido al Estudio, ${u.name}!`, 'success');
        }} />
        {toast.visible && (
          <div className={`toast ${toast.type}`}>
            {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="app-container">
      
      {/* Toast Alert popup */}
      {toast.visible && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'success' ? '✓' : '⚠️'} {toast.message}
        </div>
      )}

      {/* Top Demo Banner Indicator */}
      <div className="demo-banner" style={{ gridColumn: 'span 2' }}>
        <div className="demo-banner-left">
          <span>🟢 MODO DEMOSTRACIÓN ACTIVO</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
            Servicio AWS Bedrock Simulado
          </span>
        </div>
        <div className="demo-banner-right">
          <label style={{ fontWeight: 600, fontSize: '0.8rem' }}>Intercambiar Rol de Prueba:</label>
          <select 
            className="demo-role-select" 
            value={user.role} 
            onChange={(e) => handleRoleSwap(e.target.value)}
          >
            <option value="Admin">Administrador</option>
            <option value="Marketing">Marketing</option>
            <option value="Diseñador">Diseñador</option>
            <option value="Redactor">Redactor</option>
            <option value="Odontólogo revisor">Odontólogo Revisor</option>
            <option value="Aprobador">Aprobador (Marca)</option>
            <option value="Gerente de sucursal">Gerente de Sucursal</option>
          </select>
        </div>
      </div>

      {/* Header / Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ display: 'none' }} /* Show in mobile css */
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <div className="navbar-brand">
            🦷 Ameri Creative <span>Studio</span>
          </div>
        </div>

        <div className="navbar-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img 
              src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
              alt="Profile" 
              style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--secondary)' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 600 }}>{user.role}</span>
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            🦷 Ameri <span className="sidebar-logo-accent">Creative</span>
          </div>
          <div className="sidebar-tagline">Grupo Odontológico</div>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
            >
              <span>📊 Panel Principal</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'redactor' ? 'active' : ''}`}
              onClick={() => { setCurrentView('redactor'); setMobileMenuOpen(false); }}
            >
              <span>📝 Redactor e IA</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'images' ? 'active' : ''}`}
              onClick={() => { setCurrentView('images'); setMobileMenuOpen(false); }}
            >
              <span>🎨 Generador Visual</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'campaigns' ? 'active' : ''}`}
              onClick={() => { setCurrentView('campaigns'); setMobileMenuOpen(false); }}
            >
              <span>💰 Campañas</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'branches' ? 'active' : ''}`}
              onClick={() => { setCurrentView('branches'); setMobileMenuOpen(false); }}
            >
              <span>📍 Sucursales</span>
            </div>
          </li>
          <li className="sidebar-item">
            <div 
              className={`sidebar-link ${currentView === 'gallery' ? 'active' : ''}`}
              onClick={() => { setCurrentView('gallery'); setMobileMenuOpen(false); }}
            >
              <span>📁 Galería / Assets</span>
            </div>
          </li>
        </ul>

        <div className="sidebar-footer">
          <div>Versión 1.0.0 (MVP)</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '4px' }}>
            Diseñado para Marketing e Instructivos Clínicos.
          </div>
          <button 
            onClick={() => setPrivacyModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              marginTop: '8px',
              display: 'block'
            }}
          >
            🛡️ Política de Privacidad e IA
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard user={user} setView={setCurrentView} showToast={showToast} />
        )}
        {currentView === 'redactor' && (
          <ContentEditor user={user} showToast={showToast} />
        )}
        {currentView === 'images' && (
          <ImageGenerator user={user} showToast={showToast} />
        )}
        {currentView === 'campaigns' && (
          <CampaignManager user={user} showToast={showToast} />
        )}
        {currentView === 'branches' && (
          <BranchManager user={user} showToast={showToast} />
        )}
        {currentView === 'gallery' && (
          <Gallery user={user} showToast={showToast} />
        )}
      </main>

      {/* Privacy Policy Modal */}
      {privacyModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }} onClick={() => setPrivacyModalOpen(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '600px',
            width: '100%',
            overflow: 'hidden',
            border: '1px solid var(--gray-200)'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid var(--gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, var(--primary) 0%, #1e293b 100%)',
              color: '#ffffff'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                🛡️ Política de Privacidad y Seguridad IA
              </h3>
              <button 
                onClick={() => setPrivacyModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: 0.8,
                  padding: 0,
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div style={{
              padding: '1.75rem',
              maxHeight: '400px',
              overflowY: 'auto',
              fontSize: '0.9rem',
              lineHeight: 1.6,
              color: 'var(--gray-700)',
              textAlign: 'left'
            }}>
              <p style={{ marginTop: 0, fontWeight: 500, color: 'var(--primary)' }}>
                En Ameri Creative Studio, la privacidad de los datos clínicos y la seguridad de la información son nuestra prioridad número uno al integrar tecnologías de Inteligencia Artificial Generativa.
              </p>

              <hr style={{ border: 0, borderTop: '1px solid var(--gray-200)', margin: '1.25rem 0' }} />

              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700 }}>1. Uso de Inteligencia Artificial Generativa</h4>
              <p style={{ marginBottom: '1.25rem' }}>
                Utilizamos modelos fundacionales avanzados a través de <strong>Amazon Bedrock</strong> en entornos aislados y seguros. Los prompts ingresados y los contenidos generados se procesan estrictamente para crear material publicitario e instructivos clínicos autorizados. <strong>Bajo ninguna circunstancia las inteligencias artificiales externas utilizan tus datos ni el contenido de tus prompts para entrenar modelos públicos.</strong>
              </p>

              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700 }}>2. Cifrado de Extremo a Extremo</h4>
              <p style={{ marginBottom: '1.25rem' }}>
                Toda la transferencia de datos entre Ameri Creative Studio, el servidor local y los puntos de conexión de Amazon Web Services (AWS) está protegida mediante protocolos criptográficos modernos <strong>TLS v1.3</strong> en tránsito. Los assets visuales y copys generados se almacenan cifrados con algoritmos AES-256 (mediante claves gestionadas por AWS KMS) en reposo.
              </p>

              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700 }}>3. Cumplimiento Ético e Identidad Corporativa</h4>
              <p style={{ marginBottom: '1.25rem' }}>
                El procesamiento clínico y la generación de imágenes cumplen con las normativas éticas de imagen médica. El sistema promueve descripciones visuales positivas y no amenazantes, resguardando la integridad moral de los pacientes y asegurando el prestigio de nuestra red de clínicas.
              </p>

              <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 700 }}>4. Ausencia de Datos Sensibles (PII)</h4>
              <p style={{ marginBottom: 0 }}>
                El sistema prohíbe explícitamente y de manera transparente el procesamiento de Información de Identificación Personal (PII) de pacientes (como nombres, cédulas o números de contacto), garantizando la total anonimización de la información.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--gray-200)',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: 'var(--gray-50)'
            }}>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setPrivacyModalOpen(false)}
              >
                Entendido y Acepto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
