/* Acciones (data-act) */
const closeMenu = () => {
  $("#nav").classList.remove("open");
  $("#scrim").classList.add("hidden");
};
const need = () => isT() || isAdmin() || (toast("Solo el docente puede hacer esto."), false);
function composeClassMessage(claseId) {
  const course = S.clases.find((item) => item.id === claseId);
  if (!course) return;
  formModal(
    "Enviar mensaje · " + cname(claseId),
    fld("Asunto", "titulo", "", "required maxlength=100 placeholder='Ej. Aviso importante'") +
      `<label>Mensaje<textarea name="texto" rows="5" maxlength="2000" required placeholder="Escribe el aviso para los alumnos de esta clase"></textarea></label>` +
      `<p class="sm mu">El mensaje se guarda localmente. Para compartirlo con alumnos en otro navegador, exporta y comparte un respaldo JSON actualizado.</p>`,
    (form) => {
      const titulo = String(form.get("titulo") || "").trim();
      const texto = String(form.get("texto") || "").trim();
      if (!titulo || !texto) return "Escribe el asunto y el mensaje.";
      run(() => {
        S.messages.push({
          id: nextId(S.messages),
          claseId,
          titulo,
          texto,
          autor: S.session.name,
          fecha: new Date().toISOString(),
        });
      }, "Mensaje guardado para la clase");
    },
    "Guardar mensaje",
  );
}
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
    await authClient.auth.signOut();
    S.session = null;
    closeModal(false);
    closeMenu();
    $("#lf").reset();
    render();
  },
  newCourse() {
    if (!isAdmin()) return toast("Solo el administrador puede crear clases.");
    courseForm();
  },
  editCourse(id) {
    if (!isAdmin()) return toast("Solo el administrador puede cambiar el nombre de una clase.");
    courseForm(id);
  },
  delCourse(id) {
    if (!need()) return;
    const c = S.clases.find((x) => x.id === id);
    if (c && confirm(`¿Eliminar la clase "${c.materia}" y sus actividades?`)) {
      run(() => {
        const activityIds = S.actividades.filter((a) => a.claseId === id).map((a) => a.id);
        S.clases = S.clases.filter((course) => course.id !== id);
        S.actividades = S.actividades.filter((activity) => activity.claseId !== id);
        S.messages = S.messages.filter((message) => message.claseId !== id);
        activityIds.forEach((activityId) => delete S.calificaciones[activityId]);
      }, "Clase eliminada");
    }
  },
  viewCourse(id) {
    const c = S.clases.find((x) => x.id === id);
    if (!c) return;
    const st = S.alumnos.filter((s) => s.grupoId === c.grupoId);
    modal(
      cname(id),
      `<h3 style="font-size:15px;margin:12px 0 6px">Alumnos (${st.length})</h3>
    ${st.length ? `<ul style="padding:0;list-style:none;margin:0">${st.map((s) => `<li class="row" style="padding:8px 0;border-bottom:1px solid var(--br)"><span>${esc(s.nombre)}<br><span class="sm mu">${esc(s.email || "Sin correo")}${s.emailAcceso ? ` · Acceso: ${esc(s.emailAcceso)}` : ""}</span></span>${need() ? `<span class="row"><button data-act="editStu" data-id="${s.id}">Editar</button><button class="d" data-act="delStu" data-id="${s.id}" aria-label="Quitar a ${esc(s.nombre)}">Quitar</button></span>` : ""}</li>`).join("")}</ul>` : '<p class="mu">Aún no hay alumnos en este grupo.</p>'}
    ${need() ? `<div style="margin-top:12px"><label for="ns">Nombre (opcional, si agregas un solo alumno)</label><input id="ns" placeholder="Nombre del alumno" maxlength="80" aria-label="Nombre del alumno"><label for="se">Correo(s) del alumno (uno por línea)</label><textarea id="se" rows="3" placeholder="alumno@ejemplo.com" aria-label="Correos de los alumnos"></textarea><label for="sa">Correo(s) alternativo(s) para iniciar sesión (opcional, mismo orden)</label><textarea id="sa" rows="3" placeholder="cuenta-personal@ejemplo.com" aria-label="Correos alternativos"></textarea><button class="p" data-act="addStu" data-id="${id}">Agregar alumno(s)</button><p class="sm mu">El alumno puede iniciar sesión con su correo principal o con el alternativo registrado.</p></div>` : ""}`,
    );
  },
  manageStudents(id) {
    const course = S.clases.find((item) => item.id === id);
    if (!course) return;
    A.viewCourse(id);
  },
  messageClass(id) {
    if (!isT() && !isAdmin()) return toast("Solo el docente puede enviar mensajes.");
    if (!S.clases.some((course) => course.id === id)) return;
    composeClassMessage(id);
  },
  messageSelected() {
    if (!isT() && !isAdmin()) return toast("Solo el docente puede enviar mensajes.");
    const id = Number($("#messageClassSelect").value);
    if (!id) return toast("Selecciona una clase.");
    composeClassMessage(id);
  },
  async addStu(id) {
    if (!need()) return;
    const c = S.clases.find((x) => x.id === id);
    if (!c) return;
    const emails = $("#se").value.split(/[,\s;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean);
    const alternates = $("#sa").value.split(/[,\s;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean);
    if (!emails.length) return toast("Escribe al menos un correo electrónico.");
    if (new Set(emails).size !== emails.length) return toast("Hay correos principales repetidos.");
    if (alternates.length && alternates.length !== emails.length)
      return toast("Escribe un correo alternativo por alumno, en el mismo orden.");
    const invalid = [...emails, ...alternates].find((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    if (invalid) return toast(`El correo "${invalid}" no es válido.`);
    const existing = new Set(
      S.alumnos
        .filter((student) => student.grupoId === c.grupoId && student.email)
        .map((student) => student.email.toLowerCase()),
    );
    if (emails.some((email) => existing.has(email)))
      return toast("Uno o más correos ya están inscritos en este grupo.");
    const loginEmails = new Set(
      S.alumnos.flatMap((student) => [student.email, student.emailAcceso].filter(Boolean).map((email) => email.toLowerCase())),
    );
    const primaryEmails = new Set(emails);
    const seenAlternates = new Set();
    const duplicateAlternate = alternates.find((email) => {
      if (primaryEmails.has(email) || loginEmails.has(email) || seenAlternates.has(email)) return true;
      seenAlternates.add(email);
      return false;
    });
    if (duplicateAlternate)
      return toast(`El correo alternativo "${duplicateAlternate}" ya está asociado a otro alumno.`);
    const enteredName = $("#ns").value.trim();
    const rows = emails.map((email, index) => ({
      nombre: emails.length === 1 && enteredName ? enteredName : email.split("@")[0],
      grupo_id: c.grupoId,
      email,
      email_acceso: alternates[index] || null,
    }));
    run(() => {
      rows.forEach((row) =>
        S.alumnos.push({
          id: nextId(S.alumnos),
          nombre: row.nombre,
          grupoId: row.grupo_id,
          email: row.email,
          emailAcceso: row.email_acceso,
        }),
      );
    }, `${rows.length} alumno(s) agregado(s)`);
    A.viewCourse(id);
  },
  editStu(id) {
    if (!need()) return;
    const student = S.alumnos.find((s) => s.id === id);
    if (!student) return;
    formModal(
      "Editar correo de acceso",
      `<p class="sm mu">Correo principal: ${esc(student.email || "Sin correo")}</p>` +
        fld("Correo alternativo para iniciar sesión", "emailAcceso", student.emailAcceso || "", 'type="email" maxlength="254" placeholder="cuenta-personal@ejemplo.com"') +
        `<p class="sm mu">Déjalo vacío si el alumno usará el correo principal.</p>`,
      (f) => {
        const emailAcceso = String(f.get("emailAcceso") || "").trim().toLowerCase() || null;
        if (emailAcceso && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAcceso))
          return "Escribe un correo alternativo válido.";
        const otherEmails = S.alumnos
          .filter((s) => s.id !== id)
          .flatMap((s) => [s.email, s.emailAcceso])
          .filter(Boolean)
          .map((email) => email.toLowerCase());
        if (emailAcceso && (emailAcceso === student.email?.toLowerCase() || otherEmails.includes(emailAcceso)))
          return "Ese correo ya está asociado a otro alumno o es el correo principal.";
        run(() => {
          student.emailAcceso = emailAcceso;
        }, "Correo de acceso actualizado");
      },
      "Guardar",
    );
  },
  delStu(id) {
    if (!need()) return;
    const s = S.alumnos.find((x) => x.id === id);
    if (!s) return;
    run(() => {
      S.alumnos = S.alumnos.filter((student) => student.id !== id);
      delete S.attendance[id];
      Object.values(S.calificaciones).forEach((grades) => delete grades[id]);
    }, null);
    A.viewCourse(S.clases.find((c) => c.grupoId === s.grupoId)?.id);
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
      run(() => {
        S.actividades = S.actividades.filter((activity) => activity.id !== id);
        delete S.calificaciones[id];
      }, "Actividad eliminada");
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
        run(() => {
          S.calificaciones[id] = out;
        }, "Calificaciones guardadas");
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
      `<label>Tema<select id="th"><option value="">Automático</option><option value="light" ${S.theme === "light" ? "selected" : ""}>Claro</option><option value="dark" ${S.theme === "dark" ? "selected" : ""}>Oscuro</option></select></label>
      <hr><h3 style="font-size:15px;margin:12px 0 6px">Datos locales en JSON</h3>
      <p class="sm mu">Los datos se guardan en este navegador. Exporta respaldos para conservarlos o pasarlos a otro equipo.</p>
      <div class="row" style="justify-content:flex-start"><button class="p" data-act="exportJson">Descargar respaldo JSON</button>${isAdmin() ? '<button data-act="userRoles">Administrar usuarios y roles</button>' : ""}</div>
      ${isAdmin() ? '<label style="margin-top:12px">Importar respaldo JSON<input id="jsonBackupSettings" type="file" accept=".json,application/json"></label><button data-act="importJson">Restaurar datos JSON</button>' : ""}`,
      (r) =>
        r.querySelector("#th").addEventListener("change", (e) => {
          S.theme = e.target.value || null;
          save();
          render();
        }),
    );
  },
  exportJson() {
    const data = {
      version: 1,
      users: S.users,
      grupos: S.grupos,
      clases: S.clases,
      alumnos: S.alumnos,
      actividades: S.actividades,
      messages: S.messages,
      calificaciones: S.calificaciones,
      attendance: S.attendance,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "respaldo-edutrack.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    toast("Respaldo JSON descargado");
  },
  async importJson() {
    if (S.session && !isAdmin()) return toast("Solo el administrador puede restaurar datos.");
    const file = [...document.querySelectorAll("#jsonBackupSettings, #jsonBackupLogin")].find(
      (input) => input.files.length,
    )?.files[0];
    if (!file) return toast("Selecciona un archivo JSON.");
    if (!confirm("Importar el respaldo reemplazará los datos locales actuales. ¿Continuar?")) return;
    const previous = {
      users: S.users,
      grupos: S.grupos,
      clases: S.clases,
      alumnos: S.alumnos,
      actividades: S.actividades,
      messages: S.messages,
      calificaciones: S.calificaciones,
      attendance: S.attendance,
    };
    try {
      const data = JSON.parse(await file.text());
      const arrays = ["users", "grupos", "clases", "alumnos", "actividades"];
      if (!data || arrays.some((key) => !Array.isArray(data[key])))
        throw new Error("El JSON debe incluir las listas users, grupos, clases, alumnos y actividades.");
      if (data.messages != null && !Array.isArray(data.messages))
        throw new Error("La lista messages del JSON no es válida.");
      if (!data.calificaciones || typeof data.calificaciones !== "object" || Array.isArray(data.calificaciones))
        throw new Error("La sección calificaciones del JSON no es válida.");
      if (!data.attendance || typeof data.attendance !== "object" || Array.isArray(data.attendance))
        throw new Error("La sección attendance del JSON no es válida.");
      const validRoles = ["admin", "teacher", "student"];
      const users = data.users.map((user) => ({
        ...user,
        email: String(user.email || "").trim().toLowerCase(),
        rol: user.rol || user.role,
        nombre: user.nombre || user.name || user.email,
      }));
      if (users.some((user) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) || !validRoles.includes(user.rol)))
        throw new Error("El respaldo contiene un usuario o rol inválido.");
      if (new Set(users.map((user) => user.email)).size !== users.length)
        throw new Error("El respaldo contiene correos de usuario duplicados.");
      if (!users.some((user) => user.rol === "admin") && S.session) {
        const current = users.find((user) => user.email === S.session.email);
        if (current) current.rol = "admin";
        else users.push({
          id: S.session.id,
          email: S.session.email,
          nombre: S.session.name,
          rol: "admin",
        });
      }
      if (S.session && !users.some((user) => user.email === S.session.email))
        throw new Error("Tu correo no aparece en los usuarios del respaldo.");
      if (data.clases.some((course) => !data.grupos.some((group) => group.id === course.grupoId)))
        throw new Error("El respaldo tiene clases que apuntan a grupos inexistentes.");
      if (data.alumnos.some((student) => !data.grupos.some((group) => group.id === student.grupoId)))
        throw new Error("El respaldo tiene alumnos que apuntan a grupos inexistentes.");
      if (data.actividades.some((activity) => !data.clases.some((course) => course.id === activity.claseId)))
        throw new Error("El respaldo tiene actividades que apuntan a clases inexistentes.");
      const messages = data.messages || [];
      if (messages.some((message) => !message || typeof message !== "object" ||
        !data.clases.some((course) => course.id === message.claseId) ||
        !Number.isFinite(Number(message.id)) ||
        typeof message.titulo !== "string" || !message.titulo.trim() ||
        typeof message.texto !== "string" || !message.texto.trim() ||
        typeof message.fecha !== "string" || Number.isNaN(Date.parse(message.fecha))))
        throw new Error("El respaldo contiene mensajes incompletos o vinculados a clases inexistentes.");
      Object.assign(S, {
        users,
        grupos: data.grupos,
        clases: data.clases,
        alumnos: data.alumnos,
        actividades: data.actividades,
        messages,
        calificaciones: data.calificaciones,
        attendance: data.attendance,
      });
      if (!saveData()) {
        Object.assign(S, previous);
        return;
      }
      if (S.session) {
        const current = users.find((user) => user.email === S.session.email);
        S.session.rol = current.rol;
        S.session.name = current.nombre;
      }
      commit("Respaldo JSON restaurado");
    } catch (error) {
      Object.assign(S, previous);
      toast(error.message || "No se pudo leer el respaldo JSON.");
    }
  },
  userRoles() {
    if (!isAdmin()) return toast("Solo el administrador puede cambiar roles.");
    const list = S.users.length
      ? `<ul style="padding:0;list-style:none">${S.users.map((user) => `<li class="row" style="padding:6px 0;border-bottom:1px solid var(--br)"><span>${esc(user.nombre || user.name || user.email)}<br><span class="sm mu">${esc(user.email)} · ${esc(user.rol || user.role)}</span></span>${user.email === S.session.email ? "" : `<button class="d" data-act="removeLocalUser" data-id="${esc(user.email)}">Quitar</button>`}</li>`).join("")}</ul>`
      : '<p class="mu">No hay usuarios guardados.</p>';
    modal(
      "Usuarios y roles locales",
      `${list}<form id="userRoleForm"><label>Correo de la cuenta Supabase<input name="email" type="email" required placeholder="docente@ejemplo.com"></label><label>Nombre<input name="nombre" maxlength="80" placeholder="Nombre para mostrar"></label><label>Rol<select name="rol"><option value="student">Estudiante</option><option value="teacher">Docente</option><option value="admin">Administrador</option></select></label><div class="row end"><button class="p">Guardar usuario/rol</button></div></form><p class="sm mu">El rol se guarda localmente y solo se conserva en respaldos JSON importados en otros navegadores.</p>`,
      (root) => root.querySelector("#userRoleForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") || "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast("Escribe un correo válido.");
        const role = String(form.get("rol"));
        const nombre = String(form.get("nombre") || "").trim() || email;
        const current = S.users.find((user) => user.email === email);
        const saved = run(() => {
          if (current) Object.assign(current, { nombre, rol: role });
          else S.users.push({ id: email, email, nombre, rol: role });
        }, "Usuario y rol guardados en JSON");
        if (saved && email === S.session.email) {
          S.session.rol = role;
          S.session.name = nombre;
          render();
        }
      }),
    );
  },
  removeLocalUser(email) {
    if (!isAdmin()) return toast("Solo el administrador puede cambiar roles.");
    if (email === S.session.email) return toast("No puedes quitar tu propio acceso de administrador.");
    const user = S.users.find((item) => item.email === email);
    if (!user) return;
    if (user.rol === "admin" && S.users.filter((item) => item.rol === "admin").length <= 1)
      return toast("Debe quedar al menos un administrador.");
    if (!confirm(`¿Quitar a ${user.email} de la lista local de usuarios?`)) return;
    run(() => {
      S.users = S.users.filter((item) => item.email !== email);
    }, "Usuario quitado");
  },
};
