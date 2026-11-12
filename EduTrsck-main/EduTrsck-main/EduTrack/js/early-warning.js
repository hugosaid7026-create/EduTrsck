/* Alerta temprana para docentes */
function risks() {
  const out = [];
  S.alumnos.forEach((s) => {
    const as = S.actividades
      .filter((a) => {
        const c = S.clases.find((x) => x.id === a.claseId);
        return c && c.grupoId === s.grupoId && a.estado === "Publicado";
      })
      .sort((a, b) => a.entrega.localeCompare(b.entrega));
    const gs = as
      .map((a) => ({ a, n: (S.calificaciones[a.id] || {})[s.id] }))
      .filter((x) => x.n != null);
    const miss = as.filter(
      (a) => status(a) === "Cerrada" && (S.calificaciones[a.id] || {})[s.id] == null,
    ).length;
    const m = avg(gs.map((x) => Number(x.n))),
      why = [];
    let lvl = 0;
    if (m != null && m < 6) {
      why.push(`Promedio ${fmt(m)}`);
      lvl = 2;
    } else if (m != null && m < 7) {
      why.push(`Promedio bajo (${fmt(m)})`);
      lvl = 1;
    }
    if (gs.length >= 3) {
      const d = avg(gs.slice(0, -1).map((x) => Number(x.n))) - Number(gs.at(-1).n);
      if (d >= 1.5) {
        why.push(`La última nota bajó ${fmt(d)} puntos`);
        lvl = Math.max(lvl, 1);
      }
    }
    if (miss) {
      why.push(`Sin nota en ${miss} actividad${miss > 1 ? "es cerradas" : " cerrada"}`);
      lvl = Math.max(lvl, miss > 1 ? 2 : 1);
    }
    if (lvl) out.push({ s, lvl, why, m });
  });
  return out.sort((x, y) => y.lvl - x.lvl || (x.m ?? 10) - (y.m ?? 10));
}
function riskCard() {
  const r = risks(),
    col = r.some((x) => x.lvl == 2) ? "var(--er)" : r.length ? "var(--wa)" : "var(--ok)";
  const li = (x) =>
    `<li style="padding:8px 0;border-top:1px solid var(--br)"><strong>${esc(x.s.nombre)}</strong> <span class="b" style="color:${x.lvl == 2 ? "var(--er)" : "var(--wa)"}">${x.lvl == 2 ? "Urgente" : "En observación"}</span><br><span class="sm">${x.why.map(esc).join(" · ")}</span><br><span class="sm mu">${x.lvl == 2 ? "Sugerencia: habla con el alumno o su familia y ofrece una actividad de recuperación." : "Sugerencia: da seguimiento esta semana y refuerza el tema."}</span></li>`;
  return `<div class="card" style="margin-bottom:16px;border-left:4px solid ${col}"><h3 style="margin-bottom:8px">Alerta temprana</h3>${r.length ? `<p class="sm mu" style="margin:0 0 8px">${r.length} alumno${r.length > 1 ? "s" : ""} ${r.length > 1 ? "necesitan" : "necesita"} atención, de mayor a menor urgencia.</p><ul style="list-style:none;padding:0;margin:0">${r.slice(0, 6).map(li).join("")}</ul>${r.length > 6 ? `<p class="sm mu">y ${r.length - 6} más</p>` : ""}` : '<p class="mu" style="margin:0">Sin alertas: nadie cumple los criterios de riesgo.</p>'}<p class="sm mu" style="margin:10px 0 0">Criterios: promedio menor a 7, caída de 1.5 puntos o más en la última nota, o actividades cerradas sin calificar.</p></div>`;
}
