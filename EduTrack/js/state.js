/* Estado global, utilidades y carga de datos */
const dayStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const ui = (() => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch (e) {
    return {};
  }
})();
let S = {
  session: null,
  theme: ui.theme || null,
  route: ui.route || "dashboard",
  goal: ui.goal || 8,
  attendance: {},
  grupos: [],
  clases: [],
  alumnos: [],
  actividades: [],
  calificaciones: {},
};
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify({ theme: S.theme, route: S.route, goal: S.goal }));
  } catch (e) {}
};
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
    S.alumnos.filter((a) => a.email && a.email.toLowerCase() === myEmail()).map((a) => a.grupoId),
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
  return S.alumnos.find((a) => a.email && a.email.toLowerCase() === myEmail()) || null;
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

async function load() {
  const r = await Promise.all([
    db.from("grupos").select("*"),
    db.from("clases").select("*"),
    db.from("alumnos").select("*"),
    db.from("actividades").select("*"),
    db.from("calificaciones").select("*"),
  ]);
  const bad = r.find((x) => x.error);
  if (bad) return toast("Error al cargar datos: " + bad.error.message);
  const [g, c, a, ac, ca] = r.map((x) => x.data || []);
  S.grupos = g.map((x) => ({ id: x.id, nombre: x.nombre }));
  S.clases = c.map((x) => ({
    id: x.id,
    grupoId: x.grupo_id,
    materia: x.materia,
    docenteId: x.docente_id,
  }));
  S.alumnos = a.map((x) => ({ id: x.id, nombre: x.nombre, email: x.email, grupoId: x.grupo_id }));
  S.actividades = ac.map((x) => ({
    id: x.id,
    claseId: x.clase_id,
    titulo: x.titulo,
    entrega: x.entrega,
    estado: x.estado,
  }));
  S.calificaciones = {};
  ca.forEach((x) => ((S.calificaciones[x.actividad_id] ??= {})[x.alumno_id] = Number(x.nota)));
  const at = await db.from("asistencia").select("*");
  S.attendance = {};
  if (!at.error) at.data.forEach((x) => ((S.attendance[x.alumno_id] ??= {})[x.dia] = x.presente));
}
async function run(p, msg) {
  const { error } = await p;
  if (error) return toast("Error: " + error.message);
  await load();
  commit(msg);
}
