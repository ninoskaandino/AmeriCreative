import React, { useState } from 'react';
import { api } from '../services/api.js';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const PRESET_USERS = [
  { role: 'Admin', email: 'admin@amerident.com', pass: 'admin123', name: 'Dra. Patricia Ortiz (Director)', color: '#1e3a8a' },
  { role: 'Marketing', email: 'marketing@amerident.com', pass: 'marketing123', name: 'Marcos Peña (Mkt Lead)', color: '#0d9488' },
  { role: 'Diseñador', email: 'designer@amerident.com', pass: 'designer123', name: 'Lucía Méndez (Visuals)', color: '#ec4899' },
  { role: 'Redactor', email: 'writer@amerident.com', pass: 'writer123', name: 'Sebastián Ruiz (Copywriter)', color: '#8b5cf6' },
  { role: 'Odontólogo revisor', email: 'dentist@amerident.com', pass: 'dentist123', name: 'Dr. Alejandro Gomez (Clínico)', color: '#f59e0b' },
  { role: 'Aprobador', email: 'approver@amerident.com', pass: 'approver123', name: 'Lic. Laura Castillo (Marca/Firma)', color: '#10b981' },
  { role: 'Gerente de sucursal', email: 'manager@amerident.com', pass: 'manager123', name: 'Ing. Carlos Reyes (Naco & Kids)', color: '#3b82f6' }
];

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api.auth.login({ email, password });
      localStorage.setItem('amerident_token', data.token);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (preset: typeof PRESET_USERS[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    // Instant submission simulation
    setLoading(true);
    setError('');
    
    api.auth.login({ email: preset.email, password: preset.pass })
      .then(data => {
        localStorage.setItem('amerident_token', data.token);
        onLoginSuccess(data.user);
      })
      .catch(err => {
        setError(err.message || 'Error en inicio de sesión rápido.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgb(240, 248, 255) 0%, rgb(220, 240, 250) 90%)',
      fontFamily: 'var(--font-sans)',
      padding: '2rem 1rem',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div style={{
        maxWidth: '1000px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        overflow: 'hidden',
        border: '1px solid var(--gray-200)'
      }}>
        {/* Left Side: Preset Logins */}
        <div style={{
          padding: '2.5rem',
          backgroundColor: 'var(--primary)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Ameri Creative <span style={{ color: 'var(--secondary)' }}>Studio</span>
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-300)', marginBottom: '2rem' }}>
            Elige un rol pre-configurado para simular la experiencia completa y probar los diferentes permisos de aprobación y creación.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {PRESET_USERS.map((user) => (
              <div 
                key={user.role} 
                onClick={() => handleQuickLogin(user)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary)' }}>{user.role}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Rápido ⚡</span>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#fff' }}>{user.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{user.email}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Credentials Login */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'var(--secondary-bg)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              color: 'var(--secondary)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M7.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/>
                <path d="M16.5 10.5c.828 0 1.5-.672 1.5-1.5s-.672-1.5-1.5-1.5-1.5.672-1.5 1.5.672 1.5 1.5 1.5z"/>
                <path d="M6 14h12c0 3.314-2.686 6-6 6s-6-2.686-6-6z"/>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Ingreso Seguro</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>Introduce tus credenciales de Ameri Creative</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--danger)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo Institucional</label>
              <input 
                type="email" 
                className="form-control" 
                placeholder="nombre@amerident.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Contraseña</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? 'Iniciando Sesión...' : 'Entrar al Estudio'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem', fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center' }}>
            <span>Ameri Creative &copy; {new Date().getFullYear()}</span>
            <br />
            <span>Sistema Inteligente de Generación y Aprobación de Contenidos</span>
            <button 
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
                marginTop: '8px',
                display: 'block',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}
            >
              🛡️ Política de Privacidad e IA
            </button>
          </div>
        </div>
      </div>

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
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#ffffff', fontFamily: 'var(--font-display)', textAlign: 'left' }}>
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
                type="button"
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
};
