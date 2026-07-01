/* ============================================================
   Vista CELULAR — lo que ve quien escanea el QR
   (no accede al registro; solo retira o entrega)
   ============================================================ */
const { useState } = React;

function PhoneFrame({ children }) {
  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="phone">
      <div className="phone-bezel">
        <div className="phone-statusbar">
          <span>{hora}</span>
          <span className="notch" />
          <span className="sb-icons"><i className="sig" /><i className="wifi" /><i className="batt" /></span>
        </div>
        <div className="phone-screen">{children}</div>
      </div>
      <div className="phone-cap">Vista del celular de quien retira/entrega</div>
    </div>
  );
}

function ScanApp() {
  const [step, setStep] = useState("home"); // home | retiro | entrega | done
  const [done, setDone] = useState(null);   // {tipo, row}

  return (
    <PhoneFrame>
      <div className="scan">
        <header className="scan-head">
          <Brandmark light />
        </header>

        {step === "home" && <ScanHome onPick={setStep} />}
        {step === "retiro" && (
          <RetiroForm
            onCancel={() => setStep("home")}
            onDone={(rows) => { setDone({ tipo: "retiro", rows }); setStep("done"); }}
          />
        )}
        {step === "entrega" && (
          <EntregaForm
            onCancel={() => setStep("home")}
            onDone={(row) => { setDone({ tipo: "entrega", rows: [row] }); setStep("done"); }}
          />
        )}
        {step === "done" && (
          <DoneScreen data={done} onReset={() => { setDone(null); setStep("home"); }} />
        )}
      </div>
    </PhoneFrame>
  );
}

function ScanHome({ onPick }) {
  return (
    <div className="scan-body">
      <div className="scan-hero">
        <div className="scan-hero-tag">Obra · Edificio Invicta Herrera</div>
        <h1>Control de llaves</h1>
        <p>Escaneaste el código de la obra. Indicá qué necesitás hacer con la llave de un departamento.</p>
      </div>
      <div className="scan-actions">
        <button className="actioncard retirar" onClick={() => onPick("retiro")}>
          <span className="ac-ico"><Icon.key style={{ width: 26, height: 26 }} /></span>
          <span className="ac-tx"><b>Retirar una llave</b><small>Registro a tu nombre y empresa</small></span>
          <span className="ac-arr">→</span>
        </button>
        <button className="actioncard entregar" onClick={() => onPick("entrega")}>
          <span className="ac-ico"><Icon.check style={{ width: 26, height: 26 }} /></span>
          <span className="ac-tx"><b>Entregar una llave</b><small>Devolución y observaciones</small></span>
          <span className="ac-arr">→</span>
        </button>
      </div>
      <p className="scan-foot">El registro lo administra la dirección de obra. Tus datos quedan asentados con fecha y hora automáticas.</p>
    </div>
  );
}

/* ---------------- Retiro ---------------- */
function RetiroForm({ onCancel, onDone }) {
  const [f, setF] = useState({ persona: "", empresa: "", documento: "", celular: "" });
  const [nivel, setNivel] = useState("");
  const [dpto, setDpto] = useState("");
  const [llaves, setLlaves] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // personas conocidas → autocompletar al volver a retirar
  const conocidos = React.useMemo(() => KeyDB.personas(), []);
  function onPersona(e) {
    const val = e.target.value;
    const hit = conocidos.find((p) => p.persona.trim().toLowerCase() === val.trim().toLowerCase());
    if (hit) setF({ persona: hit.persona, documento: hit.documento || "", celular: (hit.celular || "").replace(/^\+?595\s*/, ""), empresa: hit.empresa || "" });
    else setF({ ...f, persona: val });
  }

  const NIVELES = Array.from({ length: 7 }, (_, i) => String(i + 1));
  const DEPTOS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

  const personaOk = f.persona.trim() && f.documento.trim() && f.empresa.trim();
  const selOk = nivel && dpto;
  const dupActual = selOk && llaves.some((l) => l.nivel === nivel && l.dpto === dpto);
  const pendiente = selOk && !dupActual ? [{ nivel, dpto }] : [];
  const todas = [...llaves, ...pendiente];
  const ok = personaOk && todas.length > 0;

  function agregar() {
    if (!selOk || dupActual) return;
    setLlaves([...llaves, { nivel, dpto }]);
    setNivel(""); setDpto("");
  }
  function quitar(i) { setLlaves(llaves.filter((_, idx) => idx !== i)); }

  function submit() {
    if (!ok) return;
    const rows = todas.map((l) => KeyDB.crearRetiro({ ...f, nivel: l.nivel, dpto: l.dpto }));
    onDone(rows);
  }

  return (
    <div className="scan-body">
      <BackRow title="Retirar llave" onCancel={onCancel} />
      <div className="form-stack">
        <Field label="Nombre de quien retira" hint={conocidos.length ? "Si ya retiraste antes, elegí tu nombre y se completan tus datos." : null}>
          <input className="input" list="personas-list" value={f.persona} onChange={onPersona} placeholder="Ej. Lucía Romero" />
          <datalist id="personas-list">
            {conocidos.map((p, i) => <option key={i} value={p.persona} />)}
          </datalist>
        </Field>
        <Field label="Documento de identidad">
          <input className="input mono" value={f.documento} onChange={set("documento")} placeholder="Ej. 33.120.654" inputMode="numeric" />
        </Field>
        <Field label="Empresa / Contratista">
          <input className="input" value={f.empresa} onChange={set("empresa")} placeholder="Ej. Pinturas del Valle" />
        </Field>
        <Field label="Número de celular">
          <div className="phone-input">
            <span className="phone-prefix mono">+595</span>
            <input className="input mono" value={f.celular} onChange={set("celular")} placeholder="981 123 456" inputMode="tel" type="tel" />
          </div>
        </Field>

        <div className="keys-section">
          <div className="keys-head">
            <span>Llaves a retirar</span>
            {todas.length > 0 && <span className="keys-count">{todas.length}</span>}
          </div>
          {llaves.length > 0 && (
            <div className="keys-chips">
              {llaves.map((l, i) => (
                <span className="keychip" key={i}>
                  <b className="mono">{l.dpto}</b><small>Nivel {l.nivel}</small>
                  <button type="button" onClick={() => quitar(i)} aria-label="Quitar"><Icon.x style={{ width: 12, height: 12 }} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="form-row">
            <Field label="Nivel / piso">
              <select className="select" value={nivel} onChange={(e) => { setNivel(e.target.value); setDpto(""); }}>
                <option value="">Elegir…</option>
                {NIVELES.map((n) => <option key={n} value={n}>Nivel {n}</option>)}
              </select>
            </Field>
            <Field label="Departamento">
              <select className="select" value={dpto} onChange={(e) => setDpto(e.target.value)} disabled={!nivel}>
                <option value="">{nivel ? "Elegir…" : "Elegí nivel"}</option>
                {DEPTOS.map((d) => <option key={d} value={d}>Depto {d}</option>)}
              </select>
            </Field>
          </div>
          {dupActual && <div className="dup-note">Esa llave ya está en la lista.</div>}
          <button type="button" className="btn btn-ghost btn-block add-key" disabled={!selOk || dupActual} onClick={agregar}>
            + Agregar otra llave
          </button>
        </div>

        <div className="auto-note">
          <Icon.clock style={{ width: 16, height: 16 }} />
          La fecha y hora se registran automáticamente al confirmar.
        </div>
      </div>
      <button className="btn btn-primary btn-block btn-lg" disabled={!ok} onClick={submit}>
        {todas.length > 1 ? `Confirmar retiro de ${todas.length} llaves` : "Confirmar retiro"}
      </button>
    </div>
  );
}

/* ---------------- Entrega ---------------- */
function EntregaForm({ onCancel, onDone }) {
  const [q, setQ] = useState({ dpto: "", empresa: "" });
  const [sel, setSel] = useState(null);
  const [obs, setObs] = useState("");
  const [persona, setPersona] = useState("");
  const setQk = (k) => (e) => setQ({ ...q, [k]: e.target.value });

  const matches = (q.dpto.trim() || q.empresa.trim())
    ? KeyDB.buscarAbiertos({ dpto: q.dpto, empresa: q.empresa })
    : [];

  function confirmar() {
    if (!sel) return;
    const row = KeyDB.cerrarRegistro(sel.id, { observaciones: obs, entregaPersona: persona });
    onDone(row);
  }

  if (sel) {
    const dias = KeyDB.diasAbierto(sel);
    return (
      <div className="scan-body">
        <BackRow title="Entregar llave" onCancel={() => setSel(null)} />
        <div className="match-card sel">
          <div className="mc-top">
            <span className="mc-dpto mono">Dpto {sel.dpto}</span>
            <span className="badge open"><span className="pip" />Abierto</span>
          </div>
          <div className="mc-rows">
            <div><span>Empresa / Contr.</span><b>{sel.empresa}</b></div>
            <div><span>Retiró</span><b>{sel.persona}</b></div>
            <div><span>Desde</span><b>{fmtFecha(sel.retiroAt)}</b></div>
            <div><span>Tiempo</span><b>{diasTexto(dias)}</b></div>
          </div>
        </div>
        <div className="form-stack">
          <Field label="Quién entrega" hint="Si lo entrega otra persona de la empresa, anotalo acá.">
            <input className="input" value={persona} onChange={(e) => setPersona(e.target.value)} placeholder={sel.persona} />
          </Field>
          <Field label="Observaciones" hint="Algo de interés o que haya pasado mientras tuvieron la llave (opcional).">
            <textarea className="textarea" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej. Se completó la instalación. Quedó una marca en el piso del baño…" />
          </Field>
        </div>
        <button className="btn btn-primary btn-block btn-lg" onClick={confirmar}>
          Confirmar entrega
        </button>
      </div>
    );
  }

  return (
    <div className="scan-body">
      <BackRow title="Entregar llave" onCancel={onCancel} />
      <p className="scan-lead">Buscá tu registro abierto por departamento y/o empresa.</p>
      <div className="form-stack">
        <div className="form-row">
          <Field label="N.º de departamento">
            <input className="input mono" value={q.dpto} onChange={setQk("dpto")} placeholder="301" />
          </Field>
          <Field label="Empresa / Contratista">
            <input className="input" value={q.empresa} onChange={setQk("empresa")} placeholder="(opcional)" />
          </Field>
        </div>
      </div>

      <div className="match-list">
        {(q.dpto.trim() || q.empresa.trim()) && matches.length === 0 && (
          <div className="empty-mini">No hay llaves abiertas que coincidan. Revisá el número o la empresa.</div>
        )}
        {matches.map((m) => (
          <button key={m.id} className="match-card tap" onClick={() => setSel(m)}>
            <div className="mc-top">
              <span className="mc-dpto mono">Dpto {m.dpto}</span>
              <span className="mc-arr">Entregar →</span>
            </div>
            <div className="mc-sub">{m.empresa} · {m.persona} · {diasTexto(KeyDB.diasAbierto(m))}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Pantallas auxiliares ---------------- */
function BackRow({ title, onCancel }) {
  return (
    <div className="backrow">
      <button className="back-btn" onClick={onCancel}><Icon.back style={{ width: 18, height: 18 }} /></button>
      <h2>{title}</h2>
    </div>
  );
}

function DoneScreen({ data, onReset }) {
  const retiro = data.tipo === "retiro";
  const rows = data.rows || (data.row ? [data.row] : []);
  const r = rows[0];
  const multi = rows.length > 1;

  if (retiro) {
    return (
      <div className="scan-body done">
        <div className="done-ring open">
          <Icon.check style={{ width: 40, height: 40 }} />
        </div>
        <h1>{multi ? "Llaves retiradas" : "Llave retirada"}</h1>
        <p>{multi
          ? `${rows.length} llaves quedaron asentadas en el site con estado Abierto.`
          : "El registro quedó asentado en el site con estado Abierto."}</p>
        <div className="done-card">
          {multi ? (
            <div className="dc-row col">
              <span>Departamentos ({rows.length})</span>
              <div className="done-keys">
                {rows.map((x, i) => (
                  <span className="keychip sm" key={i}><b className="mono">{x.dpto}</b><small>Nivel {x.nivel}</small></span>
                ))}
              </div>
            </div>
          ) : (
            <div className="dc-row"><span>Departamento</span><b className="mono">{r.dpto}{r.nivel ? ` · Nivel ${r.nivel}` : ""}</b></div>
          )}
          <div className="dc-row"><span>Empresa / Contratista</span><b>{r.empresa}</b></div>
          <div className="dc-row"><span>Retiró</span><b>{r.persona}</b></div>
          {r.documento ? <div className="dc-row"><span>Documento</span><b className="mono">{r.documento}</b></div> : null}
          {r.celular ? <div className="dc-row"><span>Celular</span><b className="mono">{r.celular}</b></div> : null}
          <div className="dc-row"><span>Retiro</span><b>{fmtFecha(r.retiroAt)}</b></div>
          <div className="dc-row"><span>Estado</span><StatusBadge estado="abierto" /></div>
        </div>
        <button className="btn btn-ghost btn-block" onClick={onReset}>Listo</button>
      </div>
    );
  }

  return (
    <div className="scan-body done">
      <div className="done-ring closed">
        <Icon.check style={{ width: 40, height: 40 }} />
      </div>
      <h1>Llave entregada</h1>
      <p>{`Registro cerrado. El departamento estuvo ${diasTexto(r.dias)} en poder de la empresa.`}</p>
      <div className="done-card">
        <div className="dc-row"><span>Departamento</span><b className="mono">{r.dpto}{r.nivel ? ` · Nivel ${r.nivel}` : ""}</b></div>
        <div className="dc-row"><span>Empresa / Contratista</span><b>{r.empresa}</b></div>
        <div className="dc-row"><span>Entregó</span><b>{r.entregaPersona || r.persona}</b></div>
        {r.documento ? <div className="dc-row"><span>Documento</span><b className="mono">{r.documento}</b></div> : null}
        {r.celular ? <div className="dc-row"><span>Celular</span><b className="mono">{r.celular}</b></div> : null}
        <div className="dc-row"><span>Entrega</span><b>{fmtFecha(r.entregaAt)}</b></div>
        <div className="dc-row"><span>Estado</span><StatusBadge estado={r.estado} /></div>
      </div>
      <button className="btn btn-ghost btn-block" onClick={onReset}>Listo</button>
    </div>
  );
}

window.ScanApp = ScanApp;
