/* ============================================================
   Invicta Herrera · Capa de datos — Firestore (nube) + Local seguro
   ------------------------------------------------------------
   • Si firebase-config.js tiene apiKey + projectId reales y el
     SDK de Firebase está cargado → modo NUBE (multi-dispositivo,
     tiempo real con onSnapshot).
   • Si no → modo LOCAL seguro (este dispositivo), con historial
     permanente, copias automáticas y restauración.
   En ambos modos la API pública es idéntica (crearRetiro,
   cerrarRegistro, all, subscribe…), así que el resto de la app
   no cambia. El registro NUNCA se elimina: entregar solo
   actualiza el estado.
   ============================================================ */
(function () {
  const cfg = window.FIREBASE_CONFIG || {};
  const COL = window.FIREBASE_COLLECTION || "registros_invicta_herrera";
  const canFirebase = !!(cfg.apiKey && cfg.projectId && window.firebase);

  /* ---- claves locales (respaldo / espejo / export) ---- */
  const KEY = "invicta_llaves_v1";
  const BAK = "invicta_llaves_backups_v1";
  const SEEDFLAG = "invicta_seeded_v1";
  const LEGACY_KEYS = [];
  const MAX_BAK = 40;

  const listeners = new Set();
  const statusListeners = new Set();
  let cache = [];
  let mode = "local";
  let status = { mode: "local", online: false, error: null };

  function notify() { listeners.forEach((fn) => fn(cache)); }
  function setStatus(s) { status = s; statusListeners.forEach((fn) => fn(status)); }

  /* ---- helpers locales ---- */
  function _readRaw(k) { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function _writeBackup(rows) {
    try {
      const baks = _readRaw(BAK) || [];
      baks.push({ at: new Date().toISOString(), count: rows.length, rows });
      while (baks.length > MAX_BAK) baks.shift();
      localStorage.setItem(BAK, JSON.stringify(baks));
    } catch (e) {}
  }
  function _mirror(rows) { try { localStorage.setItem(KEY, JSON.stringify(rows)); _writeBackup(rows); } catch (e) {} }
  function _saveLocal(rows) { _mirror(rows); notify(); }

  function diffDias(fromISO, toISO) { return Math.max(0, Math.round((new Date(toISO) - new Date(fromISO)) / 864e5)); }
  function uid() { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function buildSeed() {
    const now = Date.now();
    const d = (days, h = 0) => new Date(now - days * 864e5 - h * 36e5).toISOString();
    return [
      { id: "r1", dpto: "4", nivel: "3", empresa: "Electro Andina", documento: "28.456.789", persona: "Martín Quispe", retiroAt: d(6, 2), celular: "+595 981 234 567", estado: "cerrado", entregaAt: d(4, 1), entregaPersona: "Martín Quispe", observaciones: "Se finalizó el tendido eléctrico del estar. Sin novedades.", dias: 2 },
      { id: "r2", dpto: "9", nivel: "5", empresa: "Pinturas del Valle", documento: "33.120.654", persona: "Lucía Romero", retiroAt: d(2, 5), celular: "+595 971 112 334", estado: "abierto", entregaAt: null, entregaPersona: null, observaciones: null, dias: null },
      { id: "r3", dpto: "2", nivel: "1", empresa: "Aberturas Sur", documento: "30.987.123", persona: "Diego Funes", retiroAt: d(1, 3), celular: "+595 985 776 210", estado: "abierto", entregaAt: null, entregaPersona: null, observaciones: null, dias: null },
      { id: "r4", dpto: "11", nivel: "7", empresa: "Electro Andina", documento: "28.456.789", persona: "Martín Quispe", retiroAt: d(11, 0), celular: "+595 981 234 567", estado: "cerrado", entregaAt: d(8, 4), entregaPersona: "Carla Vega", observaciones: "Faltaba una tapa de toma en cocina, se reportó al capataz.", dias: 3 },
      { id: "r5", dpto: "6", nivel: "2", empresa: "Hidromax Sanitarios", documento: "26.741.300", persona: "Pablo Ledesma", retiroAt: d(0, 6), celular: "+595 992 050 418", estado: "abierto", entregaAt: null, entregaPersona: null, observaciones: null, dias: null },
    ];
  }

  function _loadInitial() {
    const main = _readRaw(KEY);
    if (Array.isArray(main)) return main;
    for (const lk of LEGACY_KEYS) { const r = _readRaw(lk); if (Array.isArray(r) && r.length) { _mirror(r); return r; } }
    const baks = _readRaw(BAK);
    if (baks && baks.length) { const last = baks[baks.length - 1]; if (last && Array.isArray(last.rows)) { _mirror(last.rows); return last.rows; } }
    if (!localStorage.getItem(SEEDFLAG)) { localStorage.setItem(SEEDFLAG, new Date().toISOString()); const s = buildSeed(); _mirror(s); return s; }
    return [];
  }

  /* ---- arranque LOCAL ---- */
  function startLocal() {
    mode = "local";
    cache = _loadInitial();
    setStatus({ mode: "local", online: true, error: null });
    notify();
  }

  /* ---- arranque NUBE (Firestore) ---- */
  let colRef = null;
  function startFirebase() {
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
      const db = firebase.firestore();
      try { db.enablePersistence({ synchronizeTabs: true }).catch(() => {}); } catch (e) {}
      colRef = db.collection(COL);
      mode = "firebase";
      setStatus({ mode: "firebase", online: false, error: null });
      // mostrar de inmediato lo último conocido (espejo local) mientras conecta
      const local = _readRaw(KEY);
      if (Array.isArray(local) && local.length) { cache = local; notify(); }
      colRef.onSnapshot(
        (snap) => {
          cache = snap.docs.map((d) => d.data());
          _mirror(cache); // espejo local para respaldo / export / offline
          setStatus({ mode: "firebase", online: true, error: null });
          notify();
        },
        (err) => setStatus({ mode: "firebase", online: false, error: err.message })
      );
    } catch (e) {
      console.warn("Firebase no disponible, usando modo local:", e);
      startLocal();
      setStatus({ mode: "local", online: true, error: "Firebase no disponible: " + e.message });
    }
  }

  if (canFirebase) startFirebase(); else startLocal();

  /* ============================================================
     API pública
     ============================================================ */
  const KeyDB = {
    get mode() { return mode; },
    status() { return status; },

    all() { return (cache || []).slice().sort((a, b) => new Date(b.retiroAt) - new Date(a.retiroAt)); },
    abiertos() { return this.all().filter((r) => r.estado === "abierto"); },

    buscarAbiertos({ dpto, empresa } = {}) {
      const n = (s) => (s || "").trim().toLowerCase();
      return this.abiertos().filter((r) => (dpto ? n(r.dpto) === n(dpto) : true) && (empresa ? n(r.empresa) === n(empresa) : true));
    },

    /* Personas conocidas (para autocompletar al volver a retirar) */
    personas() {
      const map = new Map();
      this.all().forEach((r) => {
        const key = (r.persona || "").trim().toLowerCase();
        if (!key || map.has(key)) return;
        map.set(key, { persona: r.persona, documento: r.documento || "", celular: r.celular || "", empresa: r.empresa || "" });
      });
      return [...map.values()];
    },

    /* ¿Hay una llave (nivel+dpto) ya retirada y sin devolver? */
    abiertaDe({ nivel, dpto } = {}) {
      const n = (s) => (s || "").trim().toLowerCase();
      return this.abiertos().find((r) => n(r.nivel) === n(nivel) && n(r.dpto) === n(dpto)) || null;
    },
    estaAbierta(sel) { return !!this.abiertaDe(sel); },

    crearRetiro({ persona, empresa, dpto, nivel, documento, celular }) {
      // bloqueo de llaves en uso: no se puede retirar una llave que ya está abierta
      const enUso = this.abiertaDe({ nivel, dpto });
      if (enUso) return { error: "en_uso", existente: enUso };
      const cel = (celular || "").trim();
      const row = {
        id: uid(),
        dpto: (dpto || "").trim(), nivel: (nivel || "").trim(),
        empresa: (empresa || "").trim(), documento: (documento || "").trim(),
        celular: cel ? "+595 " + cel.replace(/^\+?595\s*/, "") : "",
        persona: (persona || "").trim(),
        retiroAt: new Date().toISOString(),
        estado: "abierto", entregaAt: null, entregaPersona: null, observaciones: null, dias: null,
      };
      cache = [row, ...(cache || [])];
      if (mode === "firebase") { notify(); colRef.doc(row.id).set(row).catch((e) => console.warn("Firestore set:", e)); }
      else { _saveLocal(cache); }
      return row;
    },

    cerrarRegistro(id, { observaciones, entregaPersona } = {}) {
      let updated = null;
      cache = (cache || []).map((r) => {
        if (r.id !== id || r.estado !== "abierto") return r;
        const entregaAt = new Date().toISOString();
        updated = { ...r, estado: "cerrado", entregaAt, entregaPersona: (entregaPersona || "").trim() || r.persona, observaciones: (observaciones || "").trim() || null, dias: diffDias(r.retiroAt, entregaAt) };
        return updated;
      });
      if (updated) {
        if (mode === "firebase") { notify(); colRef.doc(id).set(updated).catch((e) => console.warn("Firestore set:", e)); }
        else { _saveLocal(cache); }
      }
      return updated;
    },

    /* cerrar varias llaves en un solo paso (misma entrega/observaciones) */
    cerrarRegistros(ids, { observaciones, entregaPersona } = {}) {
      const set = new Set(ids || []);
      const updated = [];
      const entregaAt = new Date().toISOString();
      cache = (cache || []).map((r) => {
        if (!set.has(r.id) || r.estado !== "abierto") return r;
        const u = { ...r, estado: "cerrado", entregaAt, entregaPersona: (entregaPersona || "").trim() || r.persona, observaciones: (observaciones || "").trim() || null, dias: diffDias(r.retiroAt, entregaAt) };
        updated.push(u);
        return u;
      });
      if (updated.length) {
        if (mode === "firebase") { notify(); updated.forEach((u) => colRef.doc(u.id).set(u).catch((e) => console.warn("Firestore set:", e))); }
        else { _saveLocal(cache); }
      }
      return updated;
    },

    /* sembrar ejemplo solo en LOCAL y solo si está vacío (no destruye datos) */
    cargarEjemploSiVacio() {
      if (mode !== "local") return cache;
      if (cache && cache.length) return cache;
      cache = buildSeed(); _saveLocal(cache); return cache;
    },

    diffDias,
    diasAbierto(r) { return diffDias(r.retiroAt, new Date().toISOString()); },

    exportJSON() {
      return JSON.stringify({ obra: "Invicta Herrera", modo: mode, exportadoEl: new Date().toISOString(), registros: this.all() }, null, 2);
    },
    copias() { return _readRaw(BAK) || []; },

    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    subscribeStatus(fn) { statusListeners.add(fn); fn(status); return () => statusListeners.delete(fn); },
  };

  window.addEventListener("storage", (e) => {
    if (mode === "local" && e.key === KEY) { cache = _readRaw(KEY) || []; notify(); }
  });

  window.KeyDB = KeyDB;
})();
