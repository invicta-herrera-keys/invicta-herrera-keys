/* ============================================================
   EL SITE — registro central (solo administración)
   ============================================================ */
const { useState: useStateS, useEffect: useEffectS, useMemo } = React;

const SITE_PIN = "2026"; // PIN de acceso al registro (cambialo acá cuando quieras)

function useRows() {
  const [rows, setRows] = useStateS(KeyDB.all());
  useEffectS(() => KeyDB.subscribe(() => setRows(KeyDB.all())), []);
  return rows;
}

function useStatus() {
  const [s, setS] = useStateS(KeyDB.status());
  useEffectS(() => KeyDB.subscribeStatus(setS), []);
  return s;
}

function ConnChip({ status }) {
  let cls = "local", txt = "Local · este dispositivo";
  if (status.mode === "firebase") {
    if (status.online) { cls = "online"; txt = "Nube · en línea"; }
    else { cls = "connecting"; txt = "Nube · conectando…"; }
  }
  return <span className={"conn " + cls}><span className="conn-dot" />{txt}</span>;
}

function SiteApp() {
  const [unlocked, setUnlocked] = useStateS(false);
  if (!unlocked) return <PinLock onOk={() => setUnlocked(true)} />;
  return <Registro />;
}

/* ---------------- PIN ---------------- */
function PinLock({ onOk }) {
  const [pin, setPin] = useStateS("");
  const [err, setErr] = useStateS(false);
  function submit(e) {
    e.preventDefault();
    if (pin === SITE_PIN) onOk();
    else { setErr(true); setPin(""); }
  }
  return (
    <div className="lock-wrap">
      <form className="lock-card" onSubmit={submit}>
        <Brandmark />
        <div className="lock-ico"><Icon.lock style={{ width: 22, height: 22 }} /></div>
        <h2>Acceso al registro</h2>
        <p>Este panel es solo para la dirección de obra. Ingresá el PIN.</p>
        <input
          className={"input mono lock-input" + (err ? " err" : "")}
          value={pin} autoFocus inputMode="numeric"
          onChange={(e) => { setPin(e.target.value); setErr(false); }}
          placeholder="• • • •"
        />
        {err && <div className="lock-err">PIN incorrecto. Probá de nuevo.</div>}
        <button className="btn btn-primary btn-block btn-lg" type="submit">Entrar</button>
      </form>
    </div>
  );
}

/* ---------------- Registro ---------------- */
const FILTERS0 = { q: "", empresa: "", nivel: "", estado: "", desde: "", hasta: "" };

function Registro() {
  const rows = useRows();
  const conn = useStatus();
  const [f, setF] = useStateS(FILTERS0);
  const [open, setOpen] = useStateS({});      // expand observaciones
  const [closing, setClosing] = useStateS(null); // record to close via admin
  const [printing, setPrinting] = useStateS(null); // 'report' | 'qr'

  const empresas = useMemo(() => [...new Set(rows.map((r) => r.empresa))].sort(), [rows]);
  const niveles = useMemo(() => [...new Set(rows.map((r) => r.nivel).filter(Boolean))].sort(), [rows]);

  const setk = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const activeFilters = Object.values(f).some((v) => v);

  const filtered = useMemo(() => {
    const n = (s) => (s || "").toLowerCase();
    return rows.filter((r) => {
      if (f.q) {
        const hay = [r.persona, r.empresa, r.dpto, r.nivel, r.entregaPersona, r.documento, r.celular].map(n).join(" ");
        if (!hay.includes(n(f.q))) return false;
      }
      if (f.empresa && r.empresa !== f.empresa) return false;
      if (f.nivel && r.nivel !== f.nivel) return false;
      if (f.estado && r.estado !== f.estado) return false;
      if (f.desde && new Date(r.retiroAt) < new Date(f.desde)) return false;
      if (f.hasta && new Date(r.retiroAt) > new Date(f.hasta + "T23:59:59")) return false;
      return true;
    });
  }, [rows, f]);

  const stats = useMemo(() => ({
    total: rows.length,
    abiertos: rows.filter((r) => r.estado === "abierto").length,
    cerrados: rows.filter((r) => r.estado === "cerrado").length,
    empresas: new Set(rows.map((r) => r.empresa)).size,
  }), [rows]);

  useEffectS(() => {
    if (!printing) return;
    const t = setTimeout(() => window.print(), 350);
    const after = () => setPrinting(null);
    window.addEventListener("afterprint", after);
    return () => { clearTimeout(t); window.removeEventListener("afterprint", after); };
  }, [printing]);

  function descargarBackup() {
    const blob = new Blob([KeyDB.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
    a.href = url; a.download = `invicta-herrera_registro-llaves_${stamp}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="site">
      {printing === "report" && <ReportSheet rows={filtered} filtros={f} />}
      {printing === "qr" && <QrPoster />}

      <header className="site-head no-print">
        <Brandmark />
        <div className="sh-right">
          <ConnChip status={conn} />
          <span className="sh-obra"><Icon.building style={{ width: 16, height: 16 }} /> Edificio Invicta Herrera · Registro de llaves</span>
        </div>
      </header>

      <div className="site-main no-print">
        {/* Stats */}
        <div className="stats">
          <Stat n={stats.total} label="Registros" />
          <Stat n={stats.abiertos} label="Abiertos" tone="open" />
          <Stat n={stats.cerrados} label="Cerrados" tone="closed" />
          <Stat n={stats.empresas} label="Empresas" />
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="searchbox">
            <Icon.search style={{ width: 17, height: 17 }} />
            <input value={f.q} onChange={setk("q")} placeholder="Buscar por persona, empresa o departamento…" />
          </div>
          <div className="tb-actions">
            <button className="btn btn-ghost" onClick={() => setPrinting("qr")}><Icon.qr style={{ width: 17, height: 17 }} /> Cartel QR</button>
            <button className="btn btn-primary" onClick={() => setPrinting("report")}><Icon.pdf style={{ width: 17, height: 17 }} /> Descargar PDF A4</button>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters">
          <span className="fl-ico"><Icon.filter style={{ width: 16, height: 16 }} /> Filtros</span>
          <select className="select sm" value={f.empresa} onChange={setk("empresa")}>
            <option value="">Empresa / Contr.: todas</option>
            {empresas.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
          <select className="select sm" value={f.nivel} onChange={setk("nivel")}>
            <option value="">Nivel: todos</option>
            {niveles.map((e) => <option key={e} value={e}>Nivel {e}</option>)}
          </select>
          <select className="select sm" value={f.estado} onChange={setk("estado")}>
            <option value="">Estado: todos</option>
            <option value="abierto">Abierto</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <label className="date-f">Desde <input type="date" className="select sm" value={f.desde} onChange={setk("desde")} /></label>
          <label className="date-f">Hasta <input type="date" className="select sm" value={f.hasta} onChange={setk("hasta")} /></label>
          {activeFilters && <button className="clear-f" onClick={() => setF(FILTERS0)}><Icon.x style={{ width: 14, height: 14 }} /> Limpiar</button>}
          <span className="fl-count">{filtered.length} de {rows.length}</span>
        </div>

        {/* Tabla */}
        <div className="tablecard">
          <table className="reg-table">
            <thead>
              <tr>
                <th>Estado</th><th>Depto / Nivel</th><th>Empresa / Contratista</th><th>A cargo</th><th>Documento de identidad</th><th>Celular</th>
                <th>Retiro</th><th>Entrega</th><th className="ta-r">Días</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const dias = r.estado === "abierto" ? KeyDB.diasAbierto(r) : r.dias;
                const isOpen = open[r.id];
                return (
                  <React.Fragment key={r.id}>
                    <tr className={isOpen ? "rowopen" : ""}>
                      <td><StatusBadge estado={r.estado} /></td>
                      <td><b className="mono">{r.dpto}</b>{r.nivel ? <span className="nivel">Nivel {r.nivel}</span> : null}</td>
                      <td>{r.empresa}</td>
                      <td>{r.persona}</td>
                      <td className="mono muted">{r.documento || "—"}</td>
                      <td className="mono muted">{r.celular || "—"}</td>
                      <td className="muted">{fmtFecha(r.retiroAt)}</td>
                      <td className="muted">{r.estado === "abierto" ? <span className="dash">en curso</span> : fmtFecha(r.entregaAt)}</td>
                      <td className="ta-r"><b className={r.estado === "abierto" ? "dias-open" : ""}>{diasTexto(dias)}</b></td>
                      <td className="ta-r row-actions">
                        {r.observaciones && (
                          <button className="ic-btn" title="Ver observaciones" onClick={() => setOpen({ ...open, [r.id]: !isOpen })}>
                            <span className="obs-dot" />
                          </button>
                        )}
                        {r.estado === "abierto"
                          ? <button className="link-btn" onClick={() => setClosing(r)}>Cerrar</button>
                          : <button className="ic-btn" title="Detalle" onClick={() => setOpen({ ...open, [r.id]: !isOpen })}>{isOpen ? "−" : "+"}</button>}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="detail-row">
                        <td colSpan={10}>
                          <div className="detail">
                            {r.entregaPersona && r.entregaPersona !== r.persona && (
                              <div className="d-item"><span>Entregó</span><b>{r.entregaPersona}</b></div>
                            )}
                            <div className="d-item obs">
                              <span>Observaciones</span>
                              <p>{r.observaciones || "Sin observaciones registradas."}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={10}><div className="empty">No hay registros que coincidan con los filtros.</div></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="site-foot">
          <span className="foot-note"><Icon.lock style={{ width: 14, height: 14 }} /> Historial permanente · los registros no se eliminan; cada cambio guarda una copia automática.</span>
          <span className="foot-acts">
            {rows.length === 0 && KeyDB.mode === "local" && (
              <button className="link-btn" onClick={() => KeyDB.cargarEjemploSiVacio()}>Cargar datos de ejemplo</button>
            )}
            <button className="link-btn" onClick={descargarBackup}>Descargar copia de seguridad (JSON)</button>
          </span>
        </footer>
      </div>

      {closing && <CloseModal row={closing} onClose={() => setClosing(null)} />}
    </div>
  );
}

function Stat({ n, label, tone }) {
  return (
    <div className={"statcard " + (tone || "")}>
      <div className="st-n">{n}</div>
      <div className="st-l">{label}</div>
    </div>
  );
}

/* admin cierra una llave manualmente (si no se escaneó la entrega) */
function CloseModal({ row, onClose }) {
  const [obs, setObs] = useStateS("");
  const [persona, setPersona] = useStateS("");
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Cerrar registro · Dpto <span className="mono">{row.dpto}</span></h3>
          <button className="ic-btn" onClick={onClose}><Icon.x style={{ width: 18, height: 18 }} /></button>
        </div>
        <p className="modal-sub">{row.empresa} · retiró {row.persona} · {diasTexto(KeyDB.diasAbierto(row))} en curso</p>
        <div className="form-stack">
          <Field label="Quién entrega"><input className="input" value={persona} onChange={(e) => setPersona(e.target.value)} placeholder={row.persona} /></Field>
          <Field label="Observaciones"><textarea className="textarea" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Detalle de la entrega (opcional)…" /></Field>
        </div>
        <div className="modal-acts">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { KeyDB.cerrarRegistro(row.id, { observaciones: obs, entregaPersona: persona }); onClose(); }}>Confirmar entrega</button>
        </div>
      </div>
    </div>
  );
}

window.SiteApp = SiteApp;
