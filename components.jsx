/* ============================================================
   Componentes y helpers compartidos
   ============================================================ */

/* ---------- Formato de fechas (es-AR) ---------- */
function fmtFecha(iso, withTime = true) {
  if (!iso) return "—";
  const d = new Date(iso);
  const fecha = d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  if (!withTime) return fecha;
  const hora = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return `${fecha} · ${hora}`;
}
function fmtFechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function diasTexto(n) {
  if (n == null) return "—";
  if (n === 0) return "mismo día";
  return n === 1 ? "1 día" : `${n} días`;
}

/* ---------- Marca Invicta Herrera ---------- */
function Brandmark({ light = false }) {
  return (
    <span className="brandmark">
      <span className="glyph">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M3 11.2 12 4l9 7.2" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.3 10v9.2h13.4V10" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="14.2" r="1.8" stroke="white" strokeWidth="1.5" />
          <path d="M12 16v2.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="wm" style={light ? { color: "white" } : null}>
        <b>Invicta Herrera</b>
        <span style={light ? { color: "oklch(0.8 0.01 75)" } : null}>Control de Llaves</span>
      </span>
    </span>
  );
}

/* ---------- Badge de estado ---------- */
function StatusBadge({ estado }) {
  if (estado === "abierto")
    return (<span className="badge open"><span className="pip" />Abierto</span>);
  return (<span className="badge closed"><span className="pip" />Cerrado</span>);
}

/* ---------- Campo de formulario ---------- */
function Field({ label, hint, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/* ---------- Iconos (trazo simple) ---------- */
const Icon = {
  key: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="8" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.7"/><path d="m11.2 11.2 7 7M16 16l2-2M18.5 18.5 21 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  check: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12.5 10 17.5 19.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  pdf: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M7 3h7l4 4v14H7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9.5 14h5M9.5 17h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  qr: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" stroke="currentColor" strokeWidth="1.6"/><path d="M14 14h2.5v2.5H14zM18 17.5h2V20h-2.5v-2.5M17.5 14H20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  filter: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  lock: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.7"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.7"/></svg>),
  building: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="5" y="3" width="14" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  clock: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M12 8v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>),
  trash: (p) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

Object.assign(window, { fmtFecha, fmtFechaCorta, diasTexto, Brandmark, StatusBadge, Field, Icon });
