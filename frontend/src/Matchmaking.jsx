import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Clock, Code, Edit3, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const ROLES_DISPONIBLES = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "Base de Datos / DBA",
  "Documentación & QA",
  "Líder / Coordinador"
];

const HORARIOS = ["Mañanas", "Tardes", "Noches", "Fines de Semana"];

const PERFIL_BASE = {
  rol_preferido: "Frontend Developer",
  habilidades: "",
  disponibilidad: "Tardes",
  estado: "Buscando equipo",
  contacto: ""
};

export default function Matchmaking({ claseId =1, usuario }) {
  const idClaseFinal = claseId || 1;
  const [perfiles, setPerfiles] = useState([]);
  const [miPerfil, setMiPerfil] = useState(PERFIL_BASE);
  const [editando, setEditando] = useState(false);
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [mensaje, setMensaje] = useState('');
  const [cargandoLista, setCargandoLista] = useState(false);

  // Carga de la lista general con filtros
  const cargarPerfiles = useCallback(async () => {
    if (!claseId) return;
    setCargandoLista(true);
    try {
      const res = await axios.get(
        `${API_BASE}/matchmaking/clase/${claseId}?rol=${filtroRol}&estado=${filtroEstado}`
      );
      setPerfiles(res.data || []);
    } catch (err) {
      console.error("Error al cargar compañeros:", err);
    } finally {
      setCargandoLista(false);
    }
  }, [claseId, filtroRol, filtroEstado]);

  // Carga del perfil propio del usuario logueado
  const cargarMiPerfil = useCallback(async () => {
    if (!claseId || !usuario?.id) return;
    try {
      const res = await axios.get(`${API_BASE}/matchmaking/clase/${claseId}/usuario/${usuario.id}`);
      if (res.data) {
        setMiPerfil(res.data);
      } else {
        setMiPerfil(PERFIL_BASE);
      }
    } catch (err) {
      console.error("Error al obtener perfil propio:", err);
      setMiPerfil(PERFIL_BASE);
    }
  }, [claseId, usuario?.id]);

  useEffect(() => {
    cargarMiPerfil();
  }, [cargarMiPerfil]);

  useEffect(() => {
    cargarPerfiles();
  }, [cargarPerfiles]);

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    setMensaje('');

    // Validar que tengamos la clase y el usuario activo
    const idUsuario = usuario?.id || usuario?.usuario_id;
    if (!claseId || !idUsuario) {
      alert("Error: No se detectó la materia o la sesión del usuario.");
      return;
    }

    const payload = {
      clase_id: Number(claseId),
      usuario_id: Number(idUsuario),
      rol_preferido: miPerfil.rol_preferido || "Frontend Developer",
      habilidades: miPerfil.habilidades || '',
      disponibilidad: miPerfil.disponibilidad || "Tardes",
      estado: miPerfil.estado || 'Buscando equipo',
      contacto: miPerfil.contacto || ''
    };

    try {
      await axios.post(`${API_BASE}/matchmaking`, payload);
      setMensaje('¡Tu perfil se guardó correctamente en el directorio!');
      setEditando(false);
      cargarMiPerfil();
      cargarPerfiles();
      setTimeout(() => setMensaje(''), 4000);
    } catch (err) {
      console.error("Detalle del error en backend:", err.response?.data || err.message);
      const detalle = err.response?.data?.detail 
        ? JSON.stringify(err.response.data.detail) 
        : "Error al guardar en el servidor";
      alert(`No se pudo guardar: ${detalle}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Directorio de Equipos y Matchmaking</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
          Encuentra compañeros con habilidades complementarias y horarios compatibles para los proyectos del curso.
        </p>
      </div>

      {/* MI PERFIL */}
      <div className="nexus-card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Mi Tarjeta de Compatibilidad</h4>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Así te ven tus compañeros en esta asignatura
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setEditando(!editando)}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <Edit3 size={14} /> {editando ? "Cerrar edición" : "Modificar mis datos"}
          </button>
        </div>

        {mensaje && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {mensaje}
          </div>
        )}

        {editando ? (
          <form onSubmit={handleGuardarPerfil} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Rol Principal</label>
              <select
                value={miPerfil?.rol_preferido || ROLES_DISPONIBLES[0]}
                onChange={(e) => setMiPerfil({ ...miPerfil, rol_preferido: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                {ROLES_DISPONIBLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Disponibilidad Horaria</label>
              <select
                value={miPerfil?.disponibilidad || HORARIOS[0]}
                onChange={(e) => setMiPerfil({ ...miPerfil, disponibilidad: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Stack / Habilidades</label>
              <input
                type="text"
                placeholder="Ej. React, FastAPI, Git"
                value={miPerfil?.habilidades || ''}
                onChange={(e) => setMiPerfil({ ...miPerfil, habilidades: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Estado actual</label>
              <select
                value={miPerfil?.estado || 'Buscando equipo'}
                onChange={(e) => setMiPerfil({ ...miPerfil, estado: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="Buscando equipo">Buscando equipo</option>
                <option value="Equipo completo">Equipo completo</option>
              </select>
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Contacto rápido</label>
              <input
                type="text"
                placeholder="@telegram o WhatsApp"
                value={miPerfil?.contacto || ''}
                onChange={(e) => setMiPerfil({ ...miPerfil, contacto: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border)' }}
              />
            </div>

            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="submit" className="btn btn-primary">Guardar en Directorio</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Rol elegido</span>
              <strong style={{ color: 'var(--primary)', fontSize: '0.92rem' }}>{miPerfil?.rol_preferido || "No definido"}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Disponibilidad</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{miPerfil?.disponibilidad || "No definida"}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Estado</span>
              <span style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: miPerfil?.estado === 'Buscando equipo' ? '#fef3c7' : '#e2e8f0',
                color: miPerfil?.estado === 'Buscando equipo' ? '#b45309' : '#475569'
              }}>
                {miPerfil?.estado || "Buscando equipo"}
              </span>
            </div>
            {miPerfil?.habilidades && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Habilidades</span>
                <span style={{ fontSize: '0.88rem' }}>{miPerfil.habilidades}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>Filtrar por:</span>
        </div>

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.84rem' }}
        >
          <option value="Todos">Todos los roles</option>
          {ROLES_DISPONIBLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '0.84rem' }}
        >
          <option value="Todos">Todos los estados</option>
          <option value="Buscando equipo">Buscando equipo</option>
          <option value="Equipo completo">Equipo completo</option>
        </select>
      </div>

      {/* LISTA */}
      {cargandoLista ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          Actualizando compañeros...
        </div>
      ) : perfiles.length === 0 ? (
        <div className="nexus-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No se encontraron compañeros con los filtros seleccionados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
          {perfiles.map((p) => (
            <div key={p.id} className="nexus-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{p.estudiante_nombre}</h4>
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{p.estudiante_email}</small>
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: p.estado === 'Buscando equipo' ? '#fef3c7' : '#e2e8f0',
                    color: p.estado === 'Buscando equipo' ? '#b45309' : '#475569'
                  }}>
                    {p.estado}
                  </span>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <span style={{
                    display: 'inline-block',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    {p.rol_preferido}
                  </span>
                </div>

                {p.habilidades && (
                  <p style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Code size={13} color="var(--primary)" /> {p.habilidades}
                  </p>
                )}

                <p style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={13} /> {p.disponibilidad}
                </p>
              </div>

              {p.contacto && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                  <strong>Contacto:</strong> <code>{p.contacto}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}