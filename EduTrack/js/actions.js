/* Acciones (data-act) */
const closeMenu = () => {
  $("#nav").classList.remove("open");
  $("#scrim").classList.add("hidden");
};
const need = () => isT() || isAdmin() || (toast("Solo el docente puede hacer esto."), false);
const A = {
  nav(r) {
    S.route = r;
    save();
    closeMenu();
    render();
  },
  tog(id, b) {
    const h = document.getElementById(id).classList.toggle("hidden");
    b.setAttribute("aria-expanded", !h);
  },
  menu() {
    const o = $("#nav").classList.toggle("open");
    $("#scrim").classList.toggle("hidden", !o);
  },
  close() {
    closeModal();
  },
  theme() {
    S.theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    save();
    render();
  },
  async out() {
    await db.auth.signOut();
    Object.assign(S, {
      session: null,
      attendance: {},
      grupos: [],
      clases: [],
      alumnos: [],
      actividades: [],
      calificaciones: {},
    });
    closeModal(false);
    closeMenu();
    $("#lf").reset();
    render();
  },
  newCourse() {
    need() && courseForm();
  },
  editCourse(id) {
    need() && courseForm(id);
  },
  delCourse(id) {
    if (!need()) return;
    const c = S.clases.find((x) => x.id === id);
    if (c && confirm(`¿Eliminar la clase "${c.materia}" y sus actividades?`)) {
      run(db.from("clases").delete().eq("id", id), "Clase eliminada");
    }
  },
  viewCourse(id) {
    const c = S.clases.find((x) => x.id === id);
    if (!c) return;
    const st = S.alumnos.filter((s) => s.grupoId === c.grupoId);
    modal(
      cname(id),
      `<h3 style="font-size:15px;margin:12px 0 6px">Alumnos (${st.length})</h3>
    ${st.length ? `<ul style="padding:0;list-style:none;margin:0">${st.map((s) => `<li class="row" style="padding:4px 0">${esc(s.nombre)}${need() ? `<button class="d" data-act="delStu" data-id="${s.id}" aria-label="Quitar a ${esc(s.nombre)}">Quitar</button>` : ""}</li>`).join("")}</ul>` : '<p class="mu">Aún no hay alumnos en este grupo.</p>'}
    ${need() ? `<div class="row" style="margin-top:12px"><input id="ns" placeholder="Nombre del alumno" maxlength="80" aria-label="Nombre del alumno" style="margin:0"><input id="se" type="email" placeholder="Correo (para su acceso)" aria-label="Correo del alumno" style="margin:0"><button class="p" data-act="addStu" data-id="${id}">Agregar</button></div>` : ""}`,
    );
  },
  addStu(id) {
    if (!need()) return;
    const c = S.clases.find((x) => x.id === id);
    if (!c) return;
    const n = $("#ns").value.trim();
    if (!n) return toast("Escribe el nombre del alumno.");
    const em = $("#se").value.trim().toLowerCase() || null;
    run(db.from("alumnos").insert({ nombre: n, grupo_id: c.grupoId, email: em }), null).then(() =>
      A.viewCourse(id),
    );
  },
  delStu(id) {
    if (!need()) return;
    const s = S.alumnos.find((x) => x.id === id);
    if (!s) return;
    run(db.from("alumnos").delete().eq("id", id), null).then(() =>
      A.viewCourse(S.clases.find((c) => c.grupoId === s.grupoId)?.id),
    );
  },
  attend(id) {
    need() && attendModal(id);
  },
  newAssign() {
    need() && assignForm();
  },
  editAssign(id) {
    need() && assignForm(id);
  },
  delAssign(id) {
    if (!need()) return;
    const a = S.actividades.find((x) => x.id === id);
    if (a && confirm(`¿Eliminar la actividad "${a.titulo}" y sus calificaciones?`)) {
      run(db.from("actividades").delete().eq("id", id), "Actividad eliminada");
    }
  },
  openAssign(id) {
    const a = S.actividades.find((x) => x.id === id);
    if (!a) return;
    const mine = myGrade(a);
    modal(
      a.titulo,
      `<p class="sm mu">Clase: ${esc(cname(a.claseId))} · Entrega: ${a.entrega} ${badge(a)}</p>
    <p>${isT() || isAdmin() ? `Promedio del grupo: <strong>${fmt(aAvg(id))}</strong> (${gOf(id).length} calificaciones)` : `Mi calificación: <strong>${fmt(mine ?? null)}</strong>`}</p>
    ${isT() || isAdmin() ? `<div class="row end"><button class="d" data-act="delAssign" data-id="${id}">Eliminar</button><button data-act="editAssign" data-id="${id}">Editar</button><button class="p" data-act="grade" data-id="${id}">Registrar calificaciones</button></div>` : ""}`,
    );
  },
  grade(id) {
    if (!need()) return;
    const a = S.actividades.find((x) => x.id === id);
    if (!a) return;
    const c = S.clases.find((x) => x.id === a.claseId);
    if (!c) return;
    const st = S.alumnos.filter((s) => s.grupoId === c.grupoId),
      g = S.calificaciones[id] || {};
    if (!st.length)
      return modal(
        "Calificaciones",
        `<p class="mu">Este grupo no tiene alumnos. Agrégalos desde “Ver” en Mis clases.</p>`,
      );
    formModal(
      "Calificaciones · " + a.titulo,
      `<table><tbody>${st.map((s) => `<tr><td>${esc(s.nombre)}</td><td><input type="number" name="${s.id}" min="0" max="10" step="0.1" value="${g[s.id] ?? ""}" aria-label="Nota de ${esc(s.nombre)}" style="width:90px;margin:0"></td></tr>`).join("")}</tbody></table><p class="sm mu">Deja vacío si aún no hay nota (0 a 10).</p>`,
      (f) => {
        const out = {};
        for (const s of st) {
          const v = f.get(String(s.id));
          if (v === "") continue;
          const n = Number(v);
          if (!(n >= 0 && n <= 10)) return "Ingresa calificaciones entre 0 y 10.";
          out[s.id] = n;
        }
        const rows = Object.entries(out).map(([sid, n]) => ({
          actividad_id: id,
          alumno_id: +sid,
          nota: n,
        }));
        const clear = st.map((x) => x.id).filter((x) => !(x in out));
        (async () => {
          if (clear.length) {
            const r = await db
              .from("calificaciones")
              .delete()
              .eq("actividad_id", id)
              .in("alumno_id", clear);
            if (r.error) return toast(r.error.message);
          }
          run(
            rows.length ? db.from("calificaciones").upsert(rows) : Promise.resolve({}),
            "Calificaciones guardadas",
          );
        })();
      },
    );
  },
  csv() {
    const q = (s) =>
      `"${String(s ?? "")
        .replace(/^[=+\-@]/, "'$&")
        .replace(/"/g, '""')}"`;
    const rows = [
      ["Actividad", "Clase", "Entrega", "Estado", isT() || isAdmin() ? "Promedio" : "Mi nota"],
      ...repRows().map((r) => [...r.slice(0, 4), r[4] == null ? "" : Number(r[4]).toFixed(1)]),
    ];
    const u = URL.createObjectURL(
      new Blob(["\uFEFF" + rows.map((r) => r.map(q).join(",")).join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "reporte-edutrack.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 500);
    toast("CSV descargado");
  },
  profile() {
    modal(
      "Mi perfil",
      `<p><strong>${esc(S.session.name)}</strong></p><p class="mu">${esc(S.session.email)}<br>Rol: ${isAdmin() ? "Admin" : isT() ? "Docente" : "Estudiante"}</p>`,
    );
  },
  settings() {
    modal(
      "Configuración",
      `<label>Tema<select id="th"><option value="">Automático</option><option value="light" ${S.theme === "light" ? "selected" : ""}>Claro</option><option value="dark" ${S.theme === "dark" ? "selected" : ""}>Oscuro</option></select></label>`,
      (r) =>
        r.querySelector("#th").addEventListener("change", (e) => {
          S.theme = e.target.value || null;
          save();
          render();
        }),
    );
  },
};
