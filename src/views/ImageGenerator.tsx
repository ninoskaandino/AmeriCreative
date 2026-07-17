import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface ImageGeneratorProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const SPECIALTIES = [
  'Odontología general', 'Odontopediatría', 'Ortodoncia', 'Endodoncia', 
  'Periodoncia', 'Cirugía oral', 'Cirugía maxilofacial', 'Prótesis', 
  'Implantología', 'Estética dental', 'Rehabilitación oral', 'Emergencias odontológicas'
];

const AUDIENCES = [
  'Niños', 'Adolescentes', 'Adultos', 'Adultos mayores', 'Padres', 
  'Pacientes internacionales', 'Pacientes con seguros', 'Empresas', 'Familias'
];

const STYLES = [
  'Fotografía publicitaria', 'Realista', 'Editorial', 'Familiar', 'Infantil', 
  'Corporativo', 'Educativo', 'Minimalista', 'Premium', 'Turismo odontológico', 'Redes sociales'
];

const FORMATS = [
  'Instagram 1:1', 'Instagram vertical 4:5', 'Historia 9:16', 'Facebook', 
  'LinkedIn', 'Banner web', 'Pantalla de clínica', 'Volante', 'Correo electrónico'
];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({ user, showToast }) => {
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [treatment, setTreatment] = useState('');
  const [audience, setAudience] = useState(AUDIENCES[2]);
  const [style, setStyle] = useState(STYLES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blood, decay, scary surgical tools, missing teeth, bleeding, wounds');
  const [creativity, setCreativity] = useState(70);
  const [numImages, setNumImages] = useState(1);

  const [branches, setBranches] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<any | null>(null);
  
  // Custom states for options
  const [showLogo, setShowLogo] = useState(false);
  const [appliedIdentity, setAppliedIdentity] = useState(false);
  const [variationText, setVariationText] = useState('');

  useEffect(() => {
    // Load branches and campaigns for association dropdowns
    api.branches.getAll().then(setBranches).catch(() => {});
    api.campaigns.getAll().then(setCampaigns).catch(() => {});
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      showToast('Por favor describe la imagen que deseas generar.', 'error');
      return;
    }

    setLoading(true);
    setGeneratedImg(null);

    try {
      const finalPrompt = appliedIdentity 
        ? `${description}, aligned with Ameri Creative corporate identity, featuring white/turquoise tones, premium dental aesthetic` 
        : description;

      const result = await api.images.generate({
        objective,
        description: finalPrompt,
        specialty,
        treatment,
        audience,
        style,
        format,
        branchIds: selectedBranch ? [selectedBranch] : [],
        campaignId: selectedCampaign || undefined,
        negativePrompt,
        creativityLevel: creativity,
        numImages
      });

      setGeneratedImg(result);
      showToast('Imagen odontológica generada exitosamente.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al generar la imagen.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!description) {
      showToast('Introduce una descripción básica antes de mejorarla.', 'error');
      return;
    }
    setEnhancing(true);
    try {
      // Prompt enhancement simulation via text service edit
      const res = await api.content.edit({
        text: description,
        action: 'mejorar',
        tone: 'Premium'
      });
      // Extract prompt
      const enhanced = res.text.replace('[IA Mejorado]:', '').trim();
      setDescription(enhanced);
      showToast('Prompt optimizado para marketing dental.', 'success');
    } catch (err: any) {
      showToast('Error al mejorar el prompt.', 'error');
    } finally {
      setEnhancing(false);
    }
  };

  const handleCreateVariation = async () => {
    if (!generatedImg) return;
    setLoading(true);
    try {
      const result = await api.images.createVariation(
        generatedImg.id, 
        variationText || 'iluminación de estudio más cálida'
      );
      setGeneratedImg(result);
      showToast('Variación visual creada con éxito.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al crear variación.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToApproval = async () => {
    if (!generatedImg) return;
    try {
      await api.approvals.approve('image', generatedImg.id, 'Enviado para aprobación visual de marketing y marca.');
      setGeneratedImg({ ...generatedImg, approvalStatus: 'En revisión' });
      showToast('Enviado al canal de aprobación.', 'success');
    } catch (err: any) {
      showToast('Error al enviar a aprobación.', 'error');
    }
  };

  const downloadImage = () => {
    if (!generatedImg) return;
    // For base64 data URL we can download it directly, for remote links we can open them
    const link = document.createElement('a');
    link.href = generatedImg.fileUrl;
    link.download = `Ameri-Creative-Studio-${generatedImg.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Descarga iniciada.', 'success');
  };

  const hasDesignerRole = user.role === 'Diseñador' || user.role === 'Marketing' || user.role === 'Admin';

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Generación de Imágenes Odontológicas</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          Diseña y genera banners, posts y contenidos visuales publicitarios de la marca Ameri Creative.
        </p>
      </div>

      {/* Warnings ethics panel */}
      <div className="warning-banner">
        <span className="warning-banner-icon">⚠️</span>
        <div>
          <div className="warning-banner-title">Guía Ética de Imagen Médica Ameri Creative</div>
          <div className="warning-banner-desc">
            Está estrictamente prohibido generar o publicar imágenes que muestren sangrado explícito, cirugías expuestas o instrumental médico atemorizante. No utilices comparaciones "Antes y Después" sin consentimiento firmado por escrito, ni promesas estéticas engañosas. Las imágenes con rostros de pacientes reales requieren registro previo de consentimiento legal.
          </div>
        </div>
      </div>

      <div className="image-gen-layout">
        {/* Left Side: Form parameters */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 className="card-title">Parámetros</h3>
          
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label className="form-label">Objetivo de la imagen</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Atraer pacientes para carillas"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción detallada (Prompt)</label>
              <textarea 
                className="form-control" 
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Ej. A middle aged woman smiling brightly showing healthy teeth, warm office backdrop..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ marginTop: '0.5rem', width: '100%' }}
                onClick={handleEnhancePrompt}
                disabled={enhancing || loading}
              >
                {enhancing ? 'Optimizando prompt...' : '🪄 Mejorar prompt con IA'}
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Especialidad</label>
                <select className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Tratamiento</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Limpieza profunda" 
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
                <label className="form-label">Estilo visual</label>
                <select className="form-control" value={style} onChange={(e) => setStyle(e.target.value)}>
                  {STYLES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Formato / Razón</label>
                <select className="form-control" value={format} onChange={(e) => setFormat(e.target.value)}>
                  {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Campaña asociada</label>
                <select className="form-control" value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                  <option value="">Ninguna</option>
                  {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sucursal</label>
              <select className="form-control" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="">Toda la red Ameri Creative</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="form-row" style={{ alignItems: 'center' }}>
              <div className="form-group">
                <label className="form-label">Creatividad ({creativity}%)</label>
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={creativity} 
                  onChange={(e) => setCreativity(Number(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nro Imágenes</label>
                <select className="form-control" value={numImages} onChange={(e) => setNumImages(Number(e.target.value))}>
                  <option value="1">1 Imagen</option>
                  <option value="2">2 Variaciones</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
              disabled={loading || !hasDesignerRole}
            >
              {loading ? 'Generando en Bedrock...' : '🎨 Generar Imagen IA'}
            </button>
            
            {!hasDesignerRole && (
              <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'block', marginTop: '0.25rem', textAlign: 'center' }}>
                * Tu rol ({user.role}) no tiene permisos para ejecutar creación de arte visual.
              </span>
            )}
          </form>
        </div>

        {/* Right Side: Generated Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 className="card-title">Previsualización de Pieza</h3>
            
            <div className="image-preview-panel">
              {loading ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="spinner"></div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                    Ejecutando renderizado de alta fidelidad...
                  </p>
                </div>
              ) : generatedImg ? (
                <>
                  <img 
                    src={generatedImg.fileUrl} 
                    alt="AI Generated Dental Asset" 
                    className="image-preview-img" 
                  />
                  {/* IA generated badge watermark */}
                  <div className="ia-watermark">Generado con IA</div>
                  
                  {/* Simulated Amerident Logo overlay watermark */}
                  {showLogo && (
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      left: '15px',
                      backgroundColor: 'rgba(255, 255, 255, 0.85)',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--primary)',
                      border: '1px solid var(--gray-200)'
                    }}>
                      🦷 <span>Ameri Creative</span>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textAlign: 'center' }}>
                  Los resultados de Amazon Bedrock se mostrarán aquí.
                </p>
              )}
            </div>

            {/* Generated Actions */}
            {generatedImg && (
              <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button 
                  className={`btn ${showLogo ? 'btn-primary' : 'btn-secondary'} btn-sm`} 
                  onClick={() => setShowLogo(!showLogo)}
                >
                  {showLogo ? '✓ Con Logo' : '➕ Agregar Logo'}
                </button>

                <button 
                  className={`btn ${appliedIdentity ? 'btn-primary' : 'btn-secondary'} btn-sm`} 
                  onClick={() => {
                    setAppliedIdentity(!appliedIdentity);
                    showToast(appliedIdentity ? 'Identidad de marca removida.' : 'Guías de identidad aplicadas al prompt.', 'success');
                  }}
                >
                  {appliedIdentity ? '✓ Con Identidad de Marca' : '📐 Aplicar Branding'}
                </button>

                <button className="btn btn-secondary btn-sm" onClick={downloadImage}>
                  📥 Descargar Material
                </button>

                <button 
                  className="btn btn-warning btn-sm" 
                  onClick={handleSendToApproval}
                  disabled={generatedImg.approvalStatus !== 'Borrador'}
                >
                  {generatedImg.approvalStatus === 'Borrador' ? '✉️ Enviar a Aprobación' : `✓ ${generatedImg.approvalStatus}`}
                </button>
              </div>
            )}
          </div>

          {/* Visual variations card */}
          {generatedImg && (
            <div className="card">
              <h3 className="card-title">Crear Variación Visual</h3>
              <div className="form-group" style={{ display: 'flex', gap: '0.5rem', marginBottom: 0 }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Mismo modelo pero sonriendo más de frente"
                  value={variationText}
                  onChange={(e) => setVariationText(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleCreateVariation} disabled={loading}>
                  Variar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
