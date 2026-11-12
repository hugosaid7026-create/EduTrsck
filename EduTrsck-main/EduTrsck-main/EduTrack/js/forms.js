/* Formularios: asistencia, clases y actividades */
function attendModal(cid, day = dayStr(0)) {
  const c = S.clases.find((x) => x.id === cid);
  if (!c) return;
  const st = S.alumnos.filter((s) => s.grupoId === c.grupoId);
  if (!st.length) return toast("Agrega alumnos al grupo primero.");
  formModal(
    "Asistencia · " + cname(cid),
    `<label>Fecha<input type="date" name="day" value="${day}" max="${dayStr(0)}" required></label>` +
      st
        .map(
          (s) =>
            `<label style="display:flex;align-items:center;margin:8px 0"><input type="checkbox" name="s${s.id}" ${(S.attendance[s.id] || {})[day] === false ? "" : "checked"}>${esc(s.nombre)}</label>`,
        )
        .join("") +
      '<p class="sm mu">Marcado = presente.</p>',
    (f) => {
      const d = f.get("day");
      if (!d) return "Elige la fecha.";
      run(() => {
        st.forEach((s) => {
          (S.attendance[s.id] ??= {})[d] = f.has("s" + s.id);
        });
      }, "Asistencia guardada");
    },
  );
  $("#f [name=day]").addEventListener(
    "change",
    (e) => e.target.value && attendModal(cid, e.target.value),
  );
}
function courseForm(id) {
  if (!isAdmin()) return toast("Solo el administrador puede crear o cambiar el nombre de una clase.");
  const c = S.clases.find((x) => x.id === id) || {};
  const grupoOpts = S.grupos
    .map(
      (g) =>
        `<option value="${g.id}" ${g.id === c.grupoId ? "selected" : ""}>${esc(g.nombre)}</option>`,
    )
    .join("");
  formModal(
    id ? "Editar clase" : "Nueva clase",
    `<label>Selecciona un grupo existente<select name="grupoId"><option value="">— Seleccionar —</option>${grupoOpts}</select></label>` +
      fld("O escribe un grupo nuevo", "nuevoGrupo", "", 'maxlength=80 placeholder="Ej. 1° A"') +
      fld("Nombre de la clase", "materia", c.materia, 'required maxlength=80 placeholder="Ej. Matemáticas"') +
      `<p class="sm mu">El administrador puede seleccionar un grupo existente o escribir uno nuevo.</p>`,
    (f) => {
      const materia = String(f.get("materia") || "").trim();
      const nuevoGrupo = String(f.get("nuevoGrupo") || "").trim();
      const selectedGroupId = Number(f.get("grupoId")) || null;
      if (!nuevoGrupo && !selectedGroupId) return "Selecciona un grupo o escribe uno nuevo.";
      if (!materia) return "Escribe el nombre de la clase.";
      saveCourse(id, materia, nuevoGrupo, selectedGroupId);
    },
    id ? "Actualizar" : "Guardar",
  );
}
function saveCourse(id, materia, nuevoGrupo, selectedGroupId) {
  let grupoId = selectedGroupId;
  let groupToCreate = null;
  if (nuevoGrupo) {
    const existing = S.grupos.find(
      (g) => g.nombre.trim().toLocaleLowerCase() === nuevoGrupo.toLocaleLowerCase(),
    );
    if (existing) {
      grupoId = existing.id;
    } else {
      grupoId = nextId(S.grupos);
      groupToCreate = { id: grupoId, nombre: nuevoGrupo };
    }
  }
  if (!grupoId) return toast("Selecciona un grupo o escribe uno nuevo.");
  run(() => {
    if (groupToCreate) S.grupos.push(groupToCreate);
    if (id) {
      Object.assign(S.clases.find((course) => course.id === id), { grupoId, materia });
    } else {
      S.clases.push({ id: nextId(S.clases), grupoId, materia, docenteId: S.session.id });
    }
  }, "Clase guardada");
}
function assignForm(id) {
  const cs = myClases();
  if (!cs.length) return toast("Primero crea una clase.");
  const a = S.actividades.find((x) => x.id === id) || {
    claseId: cs[0].id,
    estado: "Borrador",
    entrega: dayStr(7),
  };
  formModal(
    id ? "Editar actividad" : "Nueva actividad",
    fld("Título", "titulo", a.titulo, "required maxlength=120") +
      `<label>Clase<select name="claseId">${cs.map((c) => `<option value="${c.id}" ${c.id === a.claseId ? "selected" : ""}>${esc(cname(c.id))}</option>`).join("")}</select></label>` +
      fld("Fecha de entrega", "entrega", a.entrega, "type=date required") +
      `<label>Estado<select name="estado"><option ${a.estado === "Borrador" ? "selected" : ""}>Borrador</option><option ${a.estado === "Publicado" ? "selected" : ""}>Publicado</option></select></label>`,
    (f) => {
      const d = {
        titulo: f.get("titulo").trim(),
        claseId: +f.get("claseId"),
        entrega: f.get("entrega"),
        estado: f.get("estado"),
      };
      if (!d.titulo || !d.entrega) return "Escribe el título y la fecha de entrega.";
      run(() => {
        if (id) Object.assign(S.actividades.find((activity) => activity.id === id), d);
        else S.actividades.push({ id: nextId(S.actividades), ...d });
      }, "Actividad guardada");
    },
    id ? "Actualizar" : "Crear actividad",
  );
}
