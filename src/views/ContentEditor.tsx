import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface ContentEditorProps {
  user: any;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const CONTENT_TYPES = [
  'Publicación para Instagram', 'Carrusel educativo', 'Texto para Facebook', 
  'Artículo de blog', 'Correo electrónico', 'Mensaje de WhatsApp', 'Guion de video', 
  'Texto para página web', 'Descripción de tratamiento', 'Preguntas frecuentes', 
  'Campaña promocional', 'Comunicado institucional', 'Mensaje de confirmación de cita', 
  'Recordatorio de cita', 'Mensaje de seguimiento', 'Respuesta a paciente', 
  'Contenido para turismo odontológico'
];

const SPECIALTIES = [
  'Odontología general', 'Odontopediatría', 'Ortodoncia', 'Endodoncia', 
  'Periodoncia', 'Cirugía oral', 'Cirugía maxilofacial', 'Prótesis', 
  'Implantología', 'Estética dental', 'Rehabilitación oral', 'Emergencias odontológicas'
];

const AUDIENCES = [
  'Niños', 'Adolescentes', 'Adultos', 'Adultos mayores', 'Padres', 
  'Pacientes internacionales', 'Pacientes con seguros', 'Empresas', 'Familias'
];

const TONOS = [
  'Profesional', 'Cercano', 'Educativo', 'Empático', 'Comercial', 
  'Institucional', 'Familiar', 'Infantil', 'Premium', 'Persuasivo', 'Tranquilizador'
];

export const ContentEditor: React.FC<ContentEditorProps> = ({ user, showToast }) => {
  // Generation state
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [treatment, setTreatment] = useState('');
  const [audience, setAudience] = useState(AUDIENCES[2]);
  const [tone, setTone] = useState(TONOS[0]);
  const [extension, setExtension] = useState<'Corto' | 'Medio' | 'Largo'>('Medio');
  const [cta, setCta] = useState('');
  const [language, setLanguage] = useState('Español');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const [branches, setBranches] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Editor states
  const [editorText, setEditorText] = useState('');
  const [editorTitle, setEditorTitle] = useState('Nuevo Copy');
  const [docStatus, setDocStatus] = useState<string>('Borrador');
  const [versions, setVersions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);

  // Clinical Review
  const [reviewResult, setReviewResult] = useState<{ safe: boolean; issues: string[]; suggestions: string[] } | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Comment section
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentMsg, setNewCommentMsg] = useState('');

  // Version Comparison
  const [compareVersion, setCompareVersion] = useState<any | null>(null);

  useEffect(() => {
    // Load lists
    api.branches.getAll().then(setBranches).catch(() => {});
    api.campaigns.getAll().then(setCampaigns).catch(() => {});
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const list = await api.content.getAll();
      setDocuments(list);
    } catch (err) {}
  };

  const loadDocumentDetails = async (id: string) => {
    try {
      setLoading(true);
      const res = await api.content.getById(id);
      setDocumentId(res.document.id);
      setEditorTitle(res.document.title);
      setEditorText(res.document.currentContent);
      setDocStatus(res.document.status);
      setVersions(res.versions);
      setCompareVersion(null);
      setReviewResult(null);

      // Load comments for doc
      const coms = await api.comments.getByResource('content', id);
      setComments(coms);
    } catch (err: any) {
      showToast('Error al cargar detalles del documento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !treatment) {
      showToast('Por favor introduce título y tratamiento.', 'error');
      return;
    }
    setLoading(true);
    setCompareVersion(null);
    setReviewResult(null);

    try {
      const res = await api.content.generate({
        title,
        contentType,
        campaignId: selectedCampaign || undefined,
        branchIds: selectedBranch ? [selectedBranch] : [],
        specialty,
        treatment,
        audience,
        channel: contentType,
        tone,
        extension,
        cta,
        language
      });

      setDocumentId(res.document.id);
      setEditorTitle(res.document.title);
      setEditorText(res.document.currentContent);
      setDocStatus(res.document.status);
      setVersions([res.version]);
      setComments([]);

      showToast('Copy redactado con IA exitosamente.', 'success');
      loadDocuments();
    } catch (err: any) {
      showToast(err.message || 'Error al generar copy.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const res = await api.content.createVersion(documentId, editorText);
      setVersions([res.version, ...versions]);
      showToast('Versión guardada manualmente.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al guardar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAIAction = async (action: string) => {
    if (!editorText) return;
    setLoading(true);
    try {
      const res = await api.content.edit({
        text: editorText,
        action,
        tone,
        documentId: documentId || undefined
      });

      setEditorText(res.text);
      if (res.version) {
        setVersions([res.version, ...versions]);
      }
      showToast(`Texto modificado vía IA (${action}).`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Error en refinamiento con IA.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClinicalAudit = async () => {
    if (!editorText) return;
    setReviewing(true);
    try {
      const res = await api.content.review({
        text: editorText,
        specialty,
        treatment
      });
      setReviewResult(res);
      if (res.safe) {
        showToast('Auditoría completada. Texto clínicamente seguro.', 'success');
      } else {
        showToast('Se encontraron observaciones clínicas en el copy.', 'error');
      }
    } catch (err) {
      showToast('Error al auditar el contenido.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const handleRestore = async (versionId: string) => {
    if (!documentId) return;
    setLoading(true);
    try {
      const res = await api.content.restoreVersion(documentId, versionId);
      setEditorText(res.version.content);
      setVersions([res.version, ...versions]);
      setCompareVersion(null);
      showToast('Versión anterior restaurada.', 'success');
    } catch (err) {
      showToast('Error al restaurar versión.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentId || !newCommentMsg.trim()) return;

    try {
      const newCom = await api.comments.create({
        resourceType: 'content',
        resourceId: documentId,
        message: newCommentMsg
      });
      setComments([...comments, newCom]);
      setNewCommentMsg('');
      showToast('Comentario añadido.', 'success');
    } catch (err) {
      showToast('Error al añadir comentario.', 'error');
    }
  };

  const handleResolveComment = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await api.comments.resolve(id, !currentStatus);
      setComments(comments.map(c => c.id === id ? updated : c));
      showToast(!currentStatus ? 'Comentario resuelto.' : 'Comentario reabierto.', 'success');
    } catch (err) {
      showToast('Error al actualizar estado del comentario.', 'error');
    }
  };

  const handleStatusTransition = async (action: 'approve' | 'reject' | 'changes', obs: string) => {
    if (!documentId) return;
    try {
      setLoading(true);
      let res;
      if (action === 'approve') {
        res = await api.approvals.approve('content', documentId, obs);
      } else if (action === 'reject') {
        res = await api.approvals.reject('content', documentId, obs);
      } else {
        res = await api.approvals.requestChanges('content', documentId, obs);
      }

      showToast(res.message, 'success');
      loadDocumentDetails(documentId);
      loadDocuments();
    } catch (err: any) {
      showToast(err.message || 'Error al cambiar fase.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2>Redactor y Asistente de Contenido Clínico</h2>
        <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>
          Redacta correos, copys para redes sociales y transforma vocabulario técnico en explicaciones sencillas para pacientes.
        </p>
      </div>

      {/* IA medical disclaimer warning */}
      <div className="warning-banner" style={{ borderLeftColor: 'var(--info)' }}>
        <span className="warning-banner-icon" style={{ color: 'var(--info)' }}>ℹ️</span>
        <div>
          <div className="warning-banner-title">Aviso de Responsabilidad de Contenido IA</div>
          <div className="warning-banner-desc">
            El contenido generado por IA es informativo y debe ser revisado por un profesional autorizado antes de su publicación. No sustituye diagnóstico, evaluación ni indicación clínica presencial.
          </div>
        </div>
      </div>

      <div className="editor-layout">
        {/* Main Work Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Generation Form */}
          <div className="card">
            <h3 className="card-title">📝 Redactar con IA</h3>
            
            <form onSubmit={handleGenerateText}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Título identificador</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Post IG - Profilaxis Preventiva"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo de contenido / Canal</label>
                  <select className="form-control" value={contentType} onChange={(e) => setContentType(e.target.value)}>
                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Especialidad</label>
                  <select className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tratamiento clínico</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Blanqueamiento Dental Laser"
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Público</label>
                  <select className="form-control" value={audience} onChange={(e) => setAudience(e.target.value)}>
                    {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tono de voz</label>
                  <select className="form-control" value={tone} onChange={(e) => setTone(e.target.value)}>
                    {TONOS.map(to => <option key={to} value={to}>{to}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Llamada a la acción (CTA)</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ej. Agenda tu cita presencial hoy"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Extensión</label>
                  <select className="form-control" value={extension} onChange={(e) => setExtension(e.target.value as any)}>
                    <option value="Corto">Corto (~50 palabras)</option>
                    <option value="Medio">Medio (~120 palabras)</option>
                    <option value="Largo">Largo (~250 palabras)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Campaña asociada</label>
                  <select className="form-control" value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                    <option value="">Ninguna</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sucursal</label>
                  <select className="form-control" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                    <option value="">Toda la red Amerident</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Idioma</label>
                  <select className="form-control" value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés (para Turismo Dental)</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Generando Copy...' : '🪄 Redactar Copy con Bedrock'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Section 2: Editor Textarea and Actions */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✍️ Editor: <span style={{ color: 'var(--gray-600)' }}>{editorTitle}</span>
                <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>{docStatus}</span>
              </h3>
              {documentId && (
                <button className="btn btn-secondary btn-sm" onClick={handleManualSave} disabled={loading}>
                  💾 Guardar Versión
                </button>
              )}
            </div>

            <textarea 
              className="editor-textarea"
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              placeholder="El contenido generado o redactado se mostrará aquí para que puedas editarlo manualmente..."
            />

            {/* AI Refinements Box */}
            <div style={{ marginTop: '1.5rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>Refinar texto con Bedrock Claude:</strong>
              <div className="editor-actions-grid">
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('mejorar')} disabled={loading || !editorText}>✨ Mejorar</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('corregir')} disabled={loading || !editorText}>✍️ Ortografía</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('resumir')} disabled={loading || !editorText}>📄 Resumir</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('expandir')} disabled={loading || !editorText}>➕ Expandir</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('simplificar')} disabled={loading || !editorText}>🩺 Simplificar Médico</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('humano')} disabled={loading || !editorText}>😊 Más Humano</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('ingles')} disabled={loading || !editorText}>🇺🇸 Traducir inglés</button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAIAction('internacional')} disabled={loading || !editorText}>✈️ Turismo dental</button>
              </div>
            </div>
          </div>

          {/* Section 3: Versions Comparison Side-by-Side */}
          {compareVersion && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}>🔍 Comparar con Versión {compareVersion.versionNumber}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setCompareVersion(null)}>Cerrar</button>
              </div>
              <div className="comparison-layout">
                <div>
                  <strong>Actual:</strong>
                  <div className="comparison-pane">{editorText}</div>
                </div>
                <div>
                  <strong>Versión {compareVersion.versionNumber} ({compareVersion.action}):</strong>
                  <div className="comparison-pane">{compareVersion.content}</div>
                  <button 
                    className="btn btn-primary btn-sm" 
                    style={{ marginTop: '1rem', width: '100%' }}
                    onClick={() => handleRestore(compareVersion.id)}
                  >
                    Restaurar esta versión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Collaboration Comments */}
          {documentId && (
            <div className="card">
              <h3 className="card-title">💬 Canal de Colaboración</h3>
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Añade observaciones, menciones o correcciones..."
                  value={newCommentMsg}
                  onChange={(e) => setNewCommentMsg(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary">Comentar</button>
              </form>

              <div className="comments-container">
                {comments.map(com => (
                  <div key={com.id} className={`comment-card ${com.resolved ? 'resolved' : ''}`}>
                    <div className="comment-meta">
                      <div>
                        <span className="comment-author">{com.userName}</span>
                        <span className="comment-role"> ({com.userRole})</span>
                      </div>
                      <span className="comment-date">
                        {new Date(com.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="comment-text">{com.message}</div>
                    
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => handleResolveComment(com.id, com.resolved)}
                    >
                      {com.resolved ? 'Reabrir ↩' : 'Marcar Resuelto ✓'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar panels: History lists, Audit logs, Approval flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Panel 1: Document Selector */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.1rem' }}>📂 Documentos Creados</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {documents.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => loadDocumentDetails(d.id)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: documentId === d.id ? 'var(--secondary-bg)' : 'var(--gray-50)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    border: '1px solid var(--gray-200)',
                    fontWeight: documentId === d.id ? 700 : 500
                  }}
                >
                  {d.title}
                </div>
              ))}
            </div>
          </div>

          {/* Panel 2: Clinical Assistant auditing checker */}
          {editorText && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>🔬 Asistente Clínico IA</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                Verifica la exactitud ética y clínica de la redacción.
              </p>
              
              <button 
                className="btn btn-secondary" 
                style={{ width: '100%', marginBottom: '1rem' }}
                onClick={handleClinicalAudit}
                disabled={reviewing}
              >
                {reviewing ? 'Auditando...' : '🛡️ Auditar Copy'}
              </button>

              {reviewResult && (
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ 
                    fontWeight: 700, 
                    color: reviewResult.safe ? 'var(--success)' : 'var(--danger)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {reviewResult.safe ? '🟢 Clínicamente Seguro' : '🔴 Requiere Revisión'}
                  </div>
                  {reviewResult.issues.length > 0 && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--danger)' }}>Alertas:</strong>
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        {reviewResult.issues.map((iss, i) => <li key={i}>{iss}</li>)}
                      </ul>
                    </div>
                  )}
                  {reviewResult.suggestions.length > 0 && (
                    <div>
                      <strong style={{ color: 'var(--primary)' }}>Sugerencias de Ajuste:</strong>
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        {reviewResult.suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Panel 3: Approval state actions */}
          {documentId && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>⛓️ Flujo de Aprobación</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
                Fase actual: <strong style={{ color: 'var(--primary)' }}>{docStatus}</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => handleStatusTransition('approve', 'Fase aprobada desde panel.')}
                >
                  ✓ Aprobar / Avanzar
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    const obs = prompt('Indica las correcciones requeridas:');
                    if (obs) handleStatusTransition('changes', obs);
                  }}
                >
                  ⚠️ Solicitar Cambios
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    const obs = prompt('Indica las razones del rechazo definitivo:');
                    if (obs) handleStatusTransition('reject', obs);
                  }}
                >
                  × Rechazar
                </button>
              </div>
            </div>
          )}

          {/* Panel 4: Versions History List */}
          {documentId && versions.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ fontSize: '1.1rem' }}>⏳ Historial de Versiones</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {versions.map(v => (
                  <div 
                    key={v.id} 
                    style={{
                      padding: '0.5rem',
                      border: '1px solid var(--gray-200)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>Versión {v.versionNumber}</span>
                      <span style={{ color: 'var(--gray-400)' }}>
                        {new Date(v.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{ color: 'var(--gray-600)' }}>Acción: {v.action}</span>
                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>Autor: {v.authorName}</span>
                    
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ alignSelf: 'flex-start', padding: '1px 6px', fontSize: '0.7rem', marginTop: '4px' }}
                      onClick={() => setCompareVersion(v)}
                    >
                      🔎 Comparar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
