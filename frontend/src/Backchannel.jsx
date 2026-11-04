import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ThumbsUp, CheckCircle, Send, UserCheck, EyeOff, HelpCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function Backchannel({ claseId, usuario }) {
  const [preguntas, setPreguntas] = useState([]);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [esAnonimo, setEsAnonimo] = useState(true);
  const [cargando, setCargando] = useState(false);

  const cargarPreguntas = async () => {
    try {
      const res = await axios.get(`${API_BASE}/preguntas/clase/${claseId}?usuario_id=${usuario.id}`);
      setPreguntas(res.data || []);
    } catch (err) {
      console.error("Error al cargar preguntas:", err);
    }
  };

  useEffect(() => {
    cargarPreguntas();
    // Sondeo periódico cada 4 segundos para simular tiempo real
    const intervalo = setInterval(cargarPreguntas, 4000);
    return () => clearInterval(intervalo);
  }, [claseId]);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!nuevaPregunta.trim()) return;

    setCargando(true);
    try {
      await axios.post(`${API_BASE}/preguntas/`, {
        clase_id: claseId,
        autor_id: usuario.id,
        contenido: nuevaPregunta.trim(),
        es_anonimo: esAnonimo
      });
      setNuevaPregunta('');
      cargarPreguntas();
    } catch (err) {
      alert("Error al enviar la duda");
    } finally {
      setCargando(false);
    }
  };

  const handleVotar = async (preguntaId) => {
    try {
      await axios.post(`${API_BASE}/preguntas/${preguntaId}/votar`, {
        usuario_id: usuario.id
      });
      cargarPreguntas();
    } catch (err) {
      console.error("Error al votar:", err);
    }
  };

  const handleResolver = async (preguntaId) => {
    try {
      await axios.put(`${API_BASE}/preguntas/${preguntaId}/resolver`, {
        usuario_id: usuario.id
      });
      cargarPreguntas();
    } catch (err) {
      alert(err.response?.data?.detail || "No tienes permisos para realizar esta acción.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Pizarra de Preguntas en Vivo</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          Publica tus dudas de clase sin temor. Vota las dudas de otros compañeros para que el profesor las priorice.
        </p>
      </div>

      {/* CAJA DE PUBLICACIÓN */}
      <div className="nexus-card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleEnviar}>
          <textarea
            rows="3"
            placeholder="¿Qué no quedó claro del tema expuesto? Escribe tu duda aquí..."
            value={nuevaPregunta}
            onChange={(e) => setNuevaPregunta(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '0.92rem',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#475569', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={esAnonimo}
                onChange={(e) => setEsAnonimo(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              {esAnonimo ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                  <EyeOff size={16} /> Preguntar de forma anónima
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserCheck size={16} /> Mostrar mi nombre ({usuario.nombre_completo})
                </span>
              )}
            </label>

            <button type="submit" className="btn btn-primary" disabled={cargando}>
              <Send size={15} /> {cargando ? 'Publicando...' : 'Hacer Pregunta'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTADO DE PREGUNTAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {preguntas.length === 0 ? (
          <div className="nexus-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <HelpCircle size={40} color="#cbd5e1" style={{ marginBottom: '10px' }} />
            <p>Aún no hay dudas registradas en esta clase.</p>
            <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>¡Sé el primero en romper el hielo y preguntar!</p>
          </div>
        ) : (
          preguntas.map((p) => (
            <div
              key={p.id}
              className="nexus-card"
              style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                opacity: p.resuelta ? 0.6 : 1,
                background: p.resuelta ? '#f8fafc' : '#ffffff',
                border: p.resuelta ? '1px dashed #cbd5e1' : '1px solid var(--border)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* BOTÓN DE VOTACIÓN */}
              <button
                type="button"
                onClick={() => handleVotar(p.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '50px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: p.ha_votado ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: p.ha_votado ? 'var(--primary-light)' : '#f8fafc',
                  color: p.ha_votado ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Votar para priorizar esta duda"
              >
                <ThumbsUp size={16} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>{p.votos_count}</span>
              </button>

              {/* CONTENIDO DE LA PREGUNTA */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: p.es_anonimo ? '#64748b' : 'var(--primary)',
                      background: p.es_anonimo ? '#f1f5f9' : 'var(--primary-light)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}
                  >
                    {p.autor}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.created_at}</span>
                  {p.resuelta && (
                    <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} /> Aclarada / Resuelta
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.95rem', color: '#1e293b', lineHeight: '1.5', textDecoration: p.resuelta ? 'line-through' : 'none' }}>
                  {p.contenido}
                </p>
              </div>

              {/* ACCIONES (RESOLVER) */}
              <div>
                <button
                  type="button"
                  onClick={() => handleResolver(p.id)}
                  className="btn btn-outline"
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.78rem',
                    color: p.resuelta ? '#16a34a' : 'var(--text-muted)',
                    borderColor: p.resuelta ? '#86efac' : 'var(--border)'
                  }}
                  title={p.resuelta ? "Reabrir pregunta" : "Marcar como resuelta en clase"}
                >
                  <CheckCircle size={14} />
                  <span>{p.resuelta ? 'Reabrir' : 'Resuelta'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}