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
      run(
        db
          .from("asistencia")
          .upsert(st.map((s) => ({ alumno_id: s.id, dia: d, presente: f.has("s" + s.id) }))),
        "Asistencia guardada",
      );
    },
  );
  $("#f [name=day]").addEventListener(
    "change",
    (e) => e.target.value && attendModal(cid, e.target.value),
  );
}
function courseForm(id) {
  const c = S.clases.find((x) => x.id === id) || {};
  const grupoOpts = S.grupos
    .map(
      (g) =>
        `<option value="${g.id}" ${g.id === c.grupoId ? "selected" : ""}>${esc(g.nombre)}</option>`,
    )
    .join("");
  formModal(
    id ? "Editar clase" : "Nueva clase",
    `<label>Grupo<select name="grupoId" required>${grupoOpts || '<option value="">— Crea un grupo primero —</option>'}</select></label>` +
      fld("Materia", "materia", c.materia, 'required maxlength=80 placeholder="Ej. Matemáticas"') +
      `<p class="sm mu">El docente se asigna automáticamente a ti.</p>`,
    (f) => {
      const d = {
        grupo_id: +f.get("grupoId"),
        materia: f.get("materia").trim(),
        docente_id: S.session.id,
      };
      if (!d.grupo_id || !d.materia) return "Elige el grupo y escribe la materia.";
      run(
        id
          ? db.from("clases").update({ grupo_id: d.grupo_id, materia: d.materia }).eq("id", id)
          : db.from("clases").insert(d),
        "Clase guardada",
      );
    },
    id ? "Actualizar" : "Guardar",
  );
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
        clase_id: +f.get("claseId"),
        entrega: f.get("entrega"),
        estado: f.get("estado"),
      };
      if (!d.titulo || !d.entrega) return "Escribe el título y la fecha de entrega.";
      run(
        id ? db.from("actividades").update(d).eq("id", id) : db.from("actividades").insert(d),
        "Actividad guardada",
      );
    },
    id ? "Actualizar" : "Crear actividad",
  );
}
