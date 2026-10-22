/* Gamificación del estudiante */
function gam() {
  const al = myAlumno();
  if (!al) return { racha: 0, best: 0, pres: 0, pas: 0, m: null, xp: 0, lvl: 1, badges: [], n: 0 };
  const att = S.attendance[al.id] || {};
  const days = Object.keys(att).sort(),
    pres = days.filter((d) => att[d]).length;
  let racha = 0,
    best = 0,
    c = 0;
  for (let i = days.length - 1; i >= 0 && att[days[i]]; i--) racha++;
  days.forEach((d) => {
    c = att[d] ? c + 1 : 0;
    best = Math.max(best, c);
  });
  const gs = vAssign()
    .map((a) => ({ a, n: myGrade(a) }))
    .filter((x) => x.n != null)
    .sort((x, y) => x.a.entrega.localeCompare(y.a.entrega))
    .map((x) => Number(x.n));
  const m = avg(gs),
    prev = gs.length > 1 ? avg(gs.slice(0, -1)) : null;
  let pas = 0;
  for (let i = gs.length - 1; i >= 0 && gs[i] >= 6; i--) pas++;
  const xp = pres * 10 + gs.reduce((t, n) => t + Math.round(n) * 5, 0);
  const badges = [
    ["🌱", "Primer paso", "Recibe tu primera calificación", gs.length >= 1],
    ["🔥", "Racha de 5", "Asiste 5 días seguidos", best >= 5],
    ["📅", "Constante", "Suma 10 asistencias", pres >= 10],
    ["🏅", "Imparable", "Aprueba 5 actividades seguidas", pas >= 5],
    [
      "📈",
      "En ascenso",
      "Supera tu promedio anterior por 1 punto",
      prev != null && gs.at(-1) - prev >= 1,
    ],
    ["⭐", "Excelencia", "Promedio de 9 o más (mínimo 3 notas)", gs.length >= 3 && m >= 9],
    ["💯", "Perfecto", "Saca un 10 en una actividad", gs.some((n) => n >= 10)],
    ["🎯", "Meta cumplida", "Alcanza tu meta de promedio", gs.length >= 2 && m >= S.goal],
  ];
  return { racha, best, pres, pas, m, xp, lvl: Math.floor(xp / 100) + 1, badges, n: gs.length };
}
function progBanner() {
  const g = gam();
  return `<div class="card" style="margin-bottom:16px"><div class="row"><span>🔥 <strong>${g.racha}</strong> días de racha · Nivel ${g.lvl} · ${g.badges.filter((b) => b[3]).length} insignias</span><button class="p" data-act="nav" data-id="progress">Ver mi progreso</button></div></div>`;
}
