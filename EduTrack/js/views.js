/* Vistas: dashboard, clases, actividades, reportes y progreso */
const badge = (a) => `<span class="b ${status(a)}">${status(a)}</span>`;
const views = {
  dashboard: {
    t: "Dashboard",
    f() {
      const as = vAssign(),
        cs = myClases();
      const al =
        isT() || isAdmin()
          ? S.alumnos.filter((a) => cs.some((c) => c.grupoId === a.grupoId)).length
          : cs.length;
      const prom =
        isT() || isAdmin()
          ? avg(
              Object.values(S.calificaciones)
                .flatMap((g) => Object.values(g))
                .map(Number),
            )
          : avg(
              as.flatMap((a) => {
                const g = myGrade(a);
                return g == null ? [] : [g];
              }),
            );
      const st = (t, n, s) =>
        `<div class="card"><h3 style="font-size:15px;font-weight:500">${t}</h3><p class="big">${n}</p><p class="sm mu" style="margin:0">${s}</p></div>`;
      const rows = [...as]
        .sort((a, b) => b.entrega.localeCompare(a.entrega))
        .slice(0, 5)
        .map(
          (a) =>
            `<tr><td><button class="link" data-act="openAssign" data-id="${a.id}">${esc(a.titulo)}</button></td><td>${esc(cname(a.claseId))}</td><td>${a.entrega}</td><td>${badge(a)}</td></tr>`,
        )
        .join("");
      return `<div class="grid g3" style="margin-bottom:16px">${st(isT() || isAdmin() ? "Alumnos" : "Mis clases", al, isT() || isAdmin() ? "En tus grupos" : "Inscritas") + st("Actividades", as.length, isT() || isAdmin() ? `${as.filter((a) => a.estado === "Publicado").length} publicadas` : "Publicadas para ti") + st(isT() || isAdmin() ? "Promedio general" : "Mi promedio", fmt(prom), "Escala 0-10")}</div>
  ${isT() || isAdmin() ? riskCard() : progBanner()}<div class="grid g2"><div class="card"><div class="row" style="margin-bottom:10px"><h3>Actividades recientes</h3><button class="link t" data-act="newAssign">+ Crear actividad</button></div>${rows ? `<div style="overflow-x:auto"><table><thead><tr><th scope="col">Título</th><th scope="col">Clase</th><th scope="col">Entrega</th><th scope="col">Estado</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="mu">Aún no hay actividades.</p>'}</div>
  <div class="card"><h3 style="margin-bottom:10px">Resumen por clase</h3>${cs.length ? cs.map((c) => `<p style="margin:0 0 10px"><strong>${esc(gname(c.grupoId))}</strong> · ${esc(c.materia)}<br><span class="sm mu">Promedio: ${fmt(cAvg(c.id))} · ${S.alumnos.filter((s) => s.grupoId === c.grupoId).length} alumnos</span></p>`).join("") : '<p class="mu">Sin clases todavía.</p>'}</div></div>`;
    },
  },
  courses: {
    t: "Clases",
    f() {
      const cs = myClases();
      return `<div class="card"><div class="row" style="margin-bottom:14px"><h3>Mis clases</h3><button class="p t" data-act="newCourse">+ Nueva clase</button></div>
  <div class="grid g3">${cs.length ? cs.map((c) => `<div class="card"><h4 class="pr">${esc(c.materia)}</h4><p class="sm mu" style="margin:0">Grupo: ${esc(gname(c.grupoId))} · ${S.alumnos.filter((s) => s.grupoId === c.grupoId).length} alumnos</p><div class="row" style="justify-content:flex-start;margin-top:10px"><button data-act="viewCourse" data-id="${c.id}">Ver</button><button class="t" data-act="attend" data-id="${c.id}">Asistencia</button><button class="p t" data-act="editCourse" data-id="${c.id}">Editar</button><button class="d t" data-act="delCourse" data-id="${c.id}">Eliminar</button></div></div>`).join("") : '<p class="mu">Todavía no hay clases. Usa “Nueva clase” para agregar una.</p>'}</div></div>`;
    },
  },
  assignments: {
    t: "Actividades",
    f() {
      const as = vAssign();
      return `<div class="card"><div class="row" style="margin-bottom:14px"><h3>Todas las actividades</h3><div class="row"><input id="q" placeholder="Buscar actividad..." aria-label="Buscar actividad" style="margin:0;width:220px"><button class="p t" data-act="newAssign">+ Crear</button></div></div>
  <div id="ac" class="grid g2">${as.map((a) => `<div class="card" data-s="${esc((a.titulo + " " + cname(a.claseId)).toLowerCase())}"><h4>${esc(a.titulo)}</h4><p class="sm mu" style="margin:2px 0 10px">${esc(cname(a.claseId))} · Entrega: ${a.entrega} ${badge(a)}</p><button data-act="openAssign" data-id="${a.id}">Abrir</button></div>`).join("")}</div>
  <p id="none" class="mu ${as.length ? "hidden" : ""}">No hay actividades que mostrar.</p></div>`;
    },
    m() {
      $("#q").addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        let n = 0;
        document.querySelectorAll("#ac>[data-s]").forEach((c) => {
          const h = !c.dataset.s.includes(q);
          c.classList.toggle("hidden", h);
          if (!h) n++;
        });
        $("#none").classList.toggle("hidden", n > 0 || (!$("#ac").children.length && false));
      });
    },
  },
  reports: {
    t: "Reportes",
    f() {
      return `<div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:10px">Reportes de desempeño</h3><div class="grid g3"><label>Clase<select id="rc"><option value="">Todas</option>${myClases()
        .map(
          (c) =>
            `<option value="${c.id}" ${rf.c == c.id ? "selected" : ""}>${esc(cname(c.id))}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Entrega desde<input type="date" id="rd" value="${rf.from}"></label><div style="align-self:end;margin-bottom:12px"><button class="p" data-act="csv">Descargar CSV</button></div></div></div><div id="rep">${repBody()}</div>`;
    },
    m() {
      const u = () => {
        rf.c = $("#rc").value;
        rf.from = $("#rd").value;
        $("#rep").innerHTML = repBody();
      };
      $("#rc").addEventListener("change", u);
      $("#rd").addEventListener("change", u);
    },
  },
  progress: {
    t: "Mi progreso",
    f() {
      if (isT() || isAdmin())
        return '<div class="card"><p class="mu">Esta sección es para estudiantes.</p></div>';
      const g = gam(),
        pb = (l, v, t, x) =>
          `<div class="bar" style="grid-template-columns:120px 1fr 64px"><span>${l}</span><div><i style="width:${Math.min(100, (v / t) * 100)}%"></i></div><b>${x}</b></div>`;
      const tg = (n) => (Math.floor(n / 5) + 1) * 5,
        got = g.badges.filter((b) => b[3]).length;
      const msg =
        g.racha >= 2
          ? `¡${g.racha} días seguidos asistiendo! Cada día suma.`
          : g.n
            ? "Cada actividad cuenta. ¡Sigue así!"
            : "Tu aventura empieza hoy: asiste, participa y consigue tu primer logro.";
      return `<div class="card" style="margin-bottom:16px"><div class="row"><div><h3>Nivel ${g.lvl}</h3><p class="sm mu" style="margin:0">${g.xp} puntos · faltan ${100 - (g.xp % 100)} para el nivel ${g.lvl + 1}</p></div><div class="big" aria-label="Racha de asistencia">🔥 ${g.racha}</div></div><p style="margin:10px 0 0">${msg}</p><p class="sm mu" style="margin:4px 0 0">Mejor racha: ${g.best} días · Asistencias: ${g.pres}</p></div>
  <div class="card" style="margin-bottom:16px"><div class="row"><h3>Mis metas</h3><label style="margin:0">Meta de promedio <select id="goal" style="width:auto;margin:0 0 0 6px">${[7, 8, 9, 10].map((n) => `<option ${S.goal == n ? "selected" : ""}>${n}</option>`).join("")}</select></label></div>
  ${pb("Promedio", g.m || 0, S.goal, fmt(g.m) + "/" + S.goal) + pb("Racha asistencia", g.racha, tg(g.racha), g.racha + "/" + tg(g.racha)) + pb("Aprobadas seguidas", g.pas, tg(g.pas), g.pas + "/" + tg(g.pas))}</div>
  <div class="card"><h3 style="margin-bottom:10px">Insignias (${got}/${g.badges.length})</h3><div class="grid g3">${g.badges.map((b) => `<div class="card" style="opacity:${b[3] ? 1 : 0.6}"><div style="font-size:30px;${b[3] ? "" : "filter:grayscale(1)"}" aria-hidden="true">${b[0]}</div><strong>${b[1]}</strong><p class="sm mu" style="margin:0">${b[2]}</p><span class="sm">${b[3] ? "✔ Conseguida" : "Por conseguir"}</span></div>`).join("")}</div></div>`;
    },
    m() {
      $("#goal")?.addEventListener("change", (e) => {
        S.goal = +e.target.value;
        save();
        render();
      });
    },
  },
};
const rf = { c: "", from: "" };
const repRows = () =>
  vAssign()
    .filter((a) => (!rf.c || a.claseId == rf.c) && (!rf.from || a.entrega >= rf.from))
    .sort((a, b) => a.entrega.localeCompare(b.entrega))
    .map((a) => [
      a.titulo,
      cname(a.claseId),
      a.entrega,
      status(a),
      isT() || isAdmin() ? aAvg(a.id) : myGrade(a),
    ]);
function repBody() {
  const rows = repRows(),
    bars = myClases().filter((c) => !rf.c || c.id == rf.c);
  return `<div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:6px">Promedio por clase</h3>${
    bars
      .map((c) => {
        const v = cAvg(c.id);
        return `<div class="bar"><span>${esc(c.materia)}</span><div><i style="width:${(v || 0) * 10}%"></i></div><b>${fmt(v)}</b></div>`;
      })
      .join("") || '<p class="mu">Sin clases.</p>'
  }</div>
  <div class="card" style="overflow-x:auto">${rows.length ? `<table><thead><tr><th scope="col">Actividad</th><th scope="col">Clase</th><th scope="col">Entrega</th><th scope="col">Estado</th><th scope="col">${isT() || isAdmin() ? "Promedio" : "Mi nota"}</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${r[2]}</td><td>${r[3]}</td><td>${fmt(r[4] ?? null)}</td></tr>`).join("")}</tbody></table>` : '<p class="mu">No hay datos con estos filtros.</p>'}</div>`;
}
