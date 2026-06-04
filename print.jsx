/* ============================================================
   Documentos imprimibles: Reporte A4 + Cartel QR A4
   Se renderizan solo durante window.print() (ver @media print)
   ============================================================ */

function filtrosTexto(f) {
  const parts = [];
  if (f.empresa) parts.push(`Empresa / Contratista: ${f.empresa}`);
  if (f.nivel) parts.push(`Nivel: ${f.nivel}`);
  if (f.estado) parts.push(`Estado: ${f.estado}`);
  if (f.q) parts.push(`Búsqueda: “${f.q}”`);
  if (f.desde) parts.push(`Desde: ${fmtFechaCorta(f.desde)}`);
  if (f.hasta) parts.push(`Hasta: ${fmtFechaCorta(f.hasta)}`);
  return parts.length ? parts.join("  ·  ") : "Sin filtros — todos los registros";
}

function ReportSheet({ rows, filtros }) {
  const hoy = new Date().toLocaleString("es-AR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const abiertos = rows.filter((r) => r.estado === "abierto").length;
  return (
    <div className="print-root report">
      <div className="rep-head">
        <div className="rep-brand">
          <Brandmark />
        </div>
        <div className="rep-meta">
          <div className="rep-title">Reporte de control de llaves</div>
          <div className="rep-date">Emitido: {hoy}</div>
        </div>
      </div>
      <div className="rep-filtros">{filtrosTexto(filtros)}</div>
      <div className="rep-summary">
        <span><b>{rows.length}</b> registros</span>
        <span><b>{abiertos}</b> abiertos</span>
        <span><b>{rows.length - abiertos}</b> cerrados</span>
      </div>

      <table className="rep-table">
        <thead>
          <tr>
            <th>Estado</th><th>Dpto</th><th>Nivel</th><th>Empresa / Contratista</th><th>A cargo</th><th>Documento de identidad</th><th>Celular</th>
            <th>Retiro</th><th>Entrega</th><th>Días</th><th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><span className={"rep-pill " + r.estado}>{r.estado === "abierto" ? "Abierto" : "Cerrado"}</span></td>
              <td className="b">{r.dpto}</td>
              <td>{r.nivel || "—"}</td>
              <td>{r.empresa}</td>
              <td>{r.persona}</td>
              <td className="mono">{r.documento || "—"}</td>
              <td className="mono">{r.celular || "—"}</td>
              <td>{fmtFecha(r.retiroAt)}</td>
              <td>{r.estado === "abierto" ? "—" : fmtFecha(r.entregaAt)}</td>
              <td className="b">{r.estado === "abierto" ? diasTexto(KeyDB.diasAbierto(r)) + " (curso)" : diasTexto(r.dias)}</td>
              <td className="obs-cell">{r.observaciones || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="rep-foot">
        <span>Edificio Invicta Herrera · Control de entrega de llaves</span>
        <span>Documento generado automáticamente — página <span className="pageno" /></span>
      </div>
    </div>
  );
}

function QrPoster() {
  // El QR apunta a la propia página del formulario (la URL pública del site).
  const url = window.location.href.split("#")[0] + "#escanear";
  const dataUrl = React.useMemo(() => {
    try {
      if (window.qrcode) {
        const qr = window.qrcode(0, "M"); // versión auto, corrección de errores media
        qr.addData(url);
        qr.make();
        return qr.createDataURL(8, 0);
      }
    } catch (e) { console.warn("QR:", e); }
    return null;
  }, [url]);

  return (
    <div className="print-root poster">
      <div className="poster-inner">
        <div className="poster-brand"><Brandmark /></div>
        <h1>Retiro y entrega de llaves</h1>
        <p className="poster-lead">Escaneá este código con la cámara de tu celular para registrar el retiro o la entrega de la llave de un departamento.</p>
        <div className="poster-qr">
          {dataUrl
            ? <img src={dataUrl} alt="Código QR" />
            : <div className="qr-fallback" style={{ display: "grid" }}><Icon.qr style={{ width: 120, height: 120 }} /><span>Generando código…</span></div>}
        </div>
        <ol className="poster-steps">
          <li><b>1.</b> Abrí la cámara y apuntá al código</li>
          <li><b>2.</b> Elegí <em>Retirar</em> o <em>Entregar</em></li>
          <li><b>3.</b> Completá tus datos y confirmá</li>
        </ol>
        <div className="poster-foot">Edificio Invicta Herrera · Dirección de obra</div>
      </div>
    </div>
  );
}

Object.assign(window, { ReportSheet, QrPoster });
