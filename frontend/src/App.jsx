import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Terminal, 
  LogOut, 
  BookOpen, 
  MessageSquare, 
  Users, 
  Bell, 
  Hash 
} from 'lucide-react';
import Backchannel from './Backchannel';
import './App.css';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [emailAuth, setEmailAuth] = useState('');
  const [passwordAuth, setPasswordAuth] = useState('');
  const [errorAuth, setErrorAuth] = useState('');
  const [cargandoAuth, setCargandoAuth] = useState(false);

  const [misClases, setMisClases] = useState([]);
  const [claseSeleccionadaId, setClaseSeleccionadaId] = useState(null);
  const [detalleClase, setDetalleClase] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('feed');

  const cargarClases = async () => {
    if (!usuario) return;
    try {
      const res = await axios.get(`${API_BASE}/clases/mis-clases/${usuario.id}`);
      const clases = res.data || [];
      setMisClases(clases);
      if (clases.length > 0 && !claseSeleccionadaId) {
        seleccionarClase(clases[0].clase_id);
      }
    } catch (err) {
      console.error("Error al cargar materias:", err);
    }
  };

  const seleccionarClase = async (id) => {
    setClaseSeleccionadaId(id);
    try {
      const res = await axios.get(`${API_BASE}/clases/${id}/detalle`);
      setDetalleClase(res.data);
    } catch (err) {
      console.error("Error al obtener detalle:", err);
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarClases();
    }
  }, [usuario]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorAuth('');
    setCargandoAuth(true);

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email: emailAuth.trim(),
        password: passwordAuth.trim()
      });
      const datos = res.data.usuario;
      setUsuario(datos);
      localStorage.setItem('usuario_sesion', JSON.stringify(datos));
    } catch (err) {
      setErrorAuth(err.response?.data?.detail || "Credenciales incorrectas");
    } finally {
      setCargandoAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('usuario_sesion');
    setUsuario(null);
    setMisClases([]);
    setClaseSeleccionadaId(null);
    setDetalleClase(null);
  };

  // VISTA DE LOGIN
  if (!usuario) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div className="brand-icon">
              <Terminal size={20} />
            </div>
            <h1 className="brand-title" style={{ color: 'var(--text-main)', margin: 0 }}>
              Nexus<span>Edu</span>
            </h1>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            Iniciar Sesión
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Accede al espacio colaborativo de tus asignaturas.
          </p>

          {errorAuth && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '14px' }}>
              {errorAuth}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="auth-form-group">
              <label>Correo Institucional</label>
              <input
                type="email"
                placeholder="alumno@test.com"
                value={emailAuth}
                onChange={(e) => setEmailAuth(e.target.value)}
                required
              />
            </div>

            <div className="auth-form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={passwordAuth}
                onChange={(e) => setPasswordAuth(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }} 
              disabled={cargandoAuth}
            >
              {cargandoAuth ? "Ingresando..." : "Entrar a NexusEdu"}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.78rem', color: '#64748b' }}>
            Acceso demo: <code>alumno@test.com</code> / <code>password123</code>
          </div>
        </div>
      </div>
    );
  }

  // WORKSPACE PRINCIPAL
  return (
    <div className="workspace-container">
      {/* SIDEBAR LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">
            <Terminal size={18} />
          </div>
          <div className="brand-title">Nexus<span>Edu</span></div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-label">Asignaturas Disponibles</span>
        </div>

        <div className="sidebar-nav">
          {misClases.map((c) => (
            <button
              key={c.clase_id}
              className={`nav-item ${claseSeleccionadaId === c.clase_id ? 'active' : ''}`}
              onClick={() => seleccionarClase(c.clase_id)}
            >
              <span className="nav-badge">{c.materia_codigo || "SIS"}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.materia_nombre}
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {usuario.nombre_completo.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{usuario.nombre_completo}</span>
              <span className="user-role">{usuario.rol}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="main-stage">
        {detalleClase ? (
          <>
            <header className="topbar">
              <div className="topbar-left">
                <Hash size={18} color="var(--primary)" />
                <h2 className="topbar-title">{detalleClase.materia}</h2>
                <span className="topbar-tag">Grupo {detalleClase.grupo}</span>
              </div>

              <nav className="topbar-tabs">
                <button
                  className={`tab-btn ${seccionActiva === 'feed' ? 'active' : ''}`}
                  onClick={() => setSeccionActiva('feed')}
                >
                  <Bell size={15} /> Tablón
                </button>
                <button
                  className={`tab-btn ${seccionActiva === 'backchannel' ? 'active' : ''}`}
                  onClick={() => setSeccionActiva('backchannel')}
                >
                  <MessageSquare size={15} /> Pizarra en Vivo (HU-01)
                </button>
                <button
                  className={`tab-btn ${seccionActiva === 'matchmaking' ? 'active' : ''}`}
                  onClick={() => setSeccionActiva('matchmaking')}
                >
                  <Users size={15} /> Matchmaking Equipos (HU-02)
                </button>
              </nav>
            </header>

            <div className="stage-content">
              {seccionActiva === 'feed' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Novedades de la Cátedra</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Docente: {detalleClase.docente}</p>
                  </div>

                  {detalleClase.publicaciones.length === 0 ? (
                    <div className="nexus-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      No hay avisos publicados en esta materia.
                    </div>
                  ) : (
                    detalleClase.publicaciones.map((p) => (
                      <article key={p.id} className="nexus-card">
                        <div className="card-header-bar">
                          <div className="post-author-box">
                            <div className="post-avatar">{p.autor.charAt(0)}</div>
                            <div className="post-meta">
                              <h4>{p.autor}</h4>
                              <small>Docente / Cátedra</small>
                            </div>
                          </div>
                        </div>
                        <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', fontWeight: 600 }}>{p.titulo}</h3>
                        <p className="post-body">{p.contenido}</p>
                      </article>
                    ))
                  )}
                </div>
              )}

              {seccionActiva === 'backchannel' && (
                <Backchannel claseId={claseSeleccionadaId} usuario={usuario} />
              )}

              {seccionActiva === 'matchmaking' && (
                <div className="nexus-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Users size={48} color="var(--primary)" style={{ marginBottom: '14px' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Red de Formación de Equipos y Estudio (HU-NEXUS-02)</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                    Directorio de estudiantes según habilidades y disponibilidad.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <BookOpen size={40} color="#cbd5e1" />
            <p style={{ fontWeight: 500, marginTop: '12px' }}>Cargando asignaturas...</p>
          </div>
        )}
      </main>
    </div>
  );
}