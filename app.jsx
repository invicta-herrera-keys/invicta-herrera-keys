/* ============================================================
   Raíz + barra de demo (alterna celular / site)
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA } = React;

function Root() {
  const initial = window.location.hash.replace("#", "") === "escanear" ? "phone" : "site";
  const [view, setView] = useStateA(initial);

  useEffectA(() => {
    document.title = view === "phone" ? "Invicta Herrera · Escanear" : "Invicta Herrera · Registro de llaves";
  }, [view]);

  return (
    <>
      <div className="demobar no-print">
        <span className="dot" />
        <span className="lbl">Demo · Invicta Herrera</span>
        <div className="seg">
          <button className={view === "phone" ? "on" : ""} onClick={() => setView("phone")}>
            📱 Vista de quien escanea
          </button>
          <button className={view === "site" ? "on" : ""} onClick={() => setView("site")}>
            🖥️ El Site (registro)
          </button>
        </div>
      </div>

      {view === "phone"
        ? <div className="stage phone-stage"><ScanApp /></div>
        : <div className="stage"><SiteApp /></div>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
