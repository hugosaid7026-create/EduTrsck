/* Estado global, utilidades y carga de datos */
const dayStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const DATA_KEY = "edutrack:data:v1";
const ui = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
})();
let storageError = "";
const stored = (() => {
  try {
    const data = JSON.parse(localStorage.getItem(DATA_KEY) || "{}");
    for (const key of ["users", "grupos", "clases", "alumnos", "actividades", "messages"]) {
      if (data[key] != null && !Array.isArray(data[key])) throw new Error(`Invalid ${key} data`);
    }
    return data;
  } catch (e) {
    storageError = "No se pudo leer el JSON local. Restaura un respaldo JSON desde esta sesión.";
    return {};
  }
})();
let S = {
  session: null,
  theme: ui.theme || null,
  route: ui.route || "dashboard",
  goal: ui.goal || 8,
  attendance: stored.attendance || {},
  users: stored.users || [],
  grupos: stored.grupos || [],
  clases: stored.clases || [],
  alumnos: stored.alumnos || [],
  actividades: stored.actividades || [],
  messages: stored.messages || [],
  calificaciones: stored.calificaciones || {},
};
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ theme: S.theme, route: S.route, goal: S.goal }));
  } catch (e) {}
};
function saveData() {
  try {
    localStorage.setItem(
      DATA_KEY,
      JSON.stringify({
        version: 1,
        users: S.users,
        grupos: S.grupos,
        clases: S.clases,
        alumnos: S.alumnos,
        actividades: S.actividades,
        messages: S.messages,
        calificaciones: S.calificaciones,
        attendance: S.attendance,
      }),
    );
    return true;
  } catch (e) {
    toast("No se pudieron guardar los datos en este navegador. Descarga un respaldo JSON y libera espacio.");
    return false;
  }
}
const nextId = (rows) => Math.max(0, ...rows.map((row) => Number(row.id) || 0)) + 1;
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const isT = () => S.session?.rol === "teacher";
const isAdmin = () => S.session?.rol === "admin";
const gname = (id) => S.grupos.find((g) => g.id === id)?.nombre || "—";
const cname = (id) => {
  const c = S.clases.find((x) => x.id === id);
  return c ? `${c.materia} · ${gname(c.grupoId)}` : "—";
};
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const fmt = (n) => (n == null ? "—" : Number(n).toFixed(1));
const gOf = (aid) => Object.values(S.calificaciones[aid] || {});
const aAvg = (aid) => avg(gOf(aid).map(Number));
const cAvg = (cid) =>
  avg(S.actividades.filter((a) => a.claseId === cid).flatMap((a) => gOf(a.id).map(Number)));
const status = (a) =>
  a.estado === "Borrador" ? "Borrador" : a.entrega < dayStr(0) ? "Cerrada" : "Abierta";
const myEmail = () => S.session?.email?.toLowerCase() || "";
const myClases = () => {
  if (isT() || isAdmin()) return S.clases;
  const grupoIds = new Set(
    S.alumnos
      .filter(
        (a) =>
          [a.email, a.emailAcceso].some((email) => email && email.toLowerCase() === myEmail()),
      )
      .map((a) => a.grupoId),
  );
  return S.clases.filter((c) => grupoIds.has(c.grupoId));
};
const myClaseIds = () => new Set(myClases().map((c) => c.id));
const vAssign = () =>
  S.actividades.filter(
    (a) => myClaseIds().has(a.claseId) && (isT() || isAdmin() || a.estado === "Publicado"),
  );
const myAlumno = () => {
  if (isT() || isAdmin()) return null;
  return (
    S.alumnos.find((a) =>
      [a.email, a.emailAcceso].some((email) => email && email.toLowerCase() === myEmail()),
    ) || null
  );
};
const myGrade = (a) => {
  const al = myAlumno();
  return al ? (S.calificaciones[a.id] || {})[al.id] : undefined;
};
const commit = (msg) => {
  save();
  closeModal();
  render();
  if (msg) toast(msg);
};

function load() {
  return Promise.resolve();
}
function run(change, msg) {
  const previous = JSON.stringify({
    users: S.users,
    grupos: S.grupos,
    clases: S.clases,
    alumnos: S.alumnos,
    actividades: S.actividades,
    messages: S.messages,
    calificaciones: S.calificaciones,
    attendance: S.attendance,
  });
  change();
  if (!saveData()) {
    Object.assign(S, JSON.parse(previous));
    return false;
  }
  commit(msg);
  return true;
}
