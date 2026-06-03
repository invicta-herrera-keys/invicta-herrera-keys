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
            onDone={(row) => { setDone({ tipo: "retiro", row }); setStep("done"); }}
          />
        )}
        {step === "entrega" && (
          <EntregaForm
            onCancel={() => setStep("home")}
            onDone={(row) => { setDone({ tipo: "entrega", row }); setStep("done"); }}
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
  const [f, setF] = useState({ persona: "", empresa: "", dpto: "", nivel: "", documento: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.persona.trim() && f.documento.trim() && f.empresa.trim() && f.dpto.trim() && f.nivel.trim();

  const NIVELES = Array.from({ length: 7 }, (_, i) => String(i + 1));
  const DEPTOS = Array.from({ length: 11 }, (_, i) => String(i + 1));

  function submit() {
    if (!ok) return;
    const row = KeyDB.crearRetiro(f);
    onDone(row);
  }

  return (
    <div className="scan-body">
      <BackRow title="Retirar llave" onCancel={onCancel} />
      <div className="form-stack">
        <Field label="Nombre de quien retira">
          <input className="input" value={f.persona} onChange={set("persona")} placeholder="Ej. Lucía Romero" />
        </Field>
        <Field label="Documento de identidad">
          <input className="input mono" value={f.documento} onChange={set("documento")} placeholder="Ej. 33.120.654" inputMode="numeric" />
        </Field>
        <Field label="Empresa / Contratista">
          <input className="input" value={f.empresa} onChange={set("empresa")} placeholder="Ej. Pinturas del Valle" />
        </Field>
        <div className="form-row">
          <Field label="Nivel / piso">
            <select className="select" value={f.nivel} onChange={set("nivel")}>
              <option value="">Elegir…</option>
              {NIVELES.map((n) => <option key={n} value={n}>Nivel {n}</option>)}
            </select>
          </Field>
          <Field label="Departamento">
            <select className="select" value={f.dpto} onChange={set("dpto")} disabled={!f.nivel}>
              <option value="">{f.nivel ? "Elegir…" : "Elegí nivel"}</option>
              {DEPTOS.map((d) => <option key={d} value={d}>Depto {d}</option>)}
            </select>
          </Field>
        </div>
        <div className="auto-note">
          <Icon.clock style={{ width: 16, height: 16 }} />
          La fecha y hora se registran automáticamente al confirmar.
        </div>
      </div>
      <button className="btn btn-primary btn-block btn-lg" disabled={!ok} onClick={submit}>
        Confirmar retiro
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
  const r = data.row;
  return (
    <div className="scan-body done">
      <div className={"done-ring " + (retiro ? "open" : "closed")}>
        <Icon.check style={{ width: 40, height: 40 }} />
      </div>
      <h1>{retiro ? "Llave retirada" : "Llave entregada"}</h1>
      <p>{retiro
        ? "El registro quedó asentado en el site con estado Abierto."
        : `Registro cerrado. El departamento estuvo ${diasTexto(r.dias)} en poder de la empresa.`}</p>
      <div className="done-card">
        <div className="dc-row"><span>Departamento</span><b className="mono">{r.dpto}{r.nivel ? ` · Nivel ${r.nivel}` : ""}</b></div>
        <div className="dc-row"><span>Empresa / Contratista</span><b>{r.empresa}</b></div>
        <div className="dc-row"><span>{retiro ? "Retiró" : "Entregó"}</span><b>{retiro ? r.persona : (r.entregaPersona || r.persona)}</b></div>
        {r.documento ? <div className="dc-row"><span>Documento</span><b className="mono">{r.documento}</b></div> : null}
        <div className="dc-row"><span>{retiro ? "Retiro" : "Entrega"}</span><b>{fmtFecha(retiro ? r.retiroAt : r.entregaAt)}</b></div>
        <div className="dc-row"><span>Estado</span><StatusBadge estado={r.estado} /></div>
      </div>
      <button className="btn btn-ghost btn-block" onClick={onReset}>Listo</button>
    </div>
  );
}

window.ScanApp = ScanApp;
