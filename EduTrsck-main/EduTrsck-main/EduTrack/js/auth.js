/* Login con Supabase Auth e inicio de la app */
async function start(user) {
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) return ($("#lerr").textContent = "La cuenta no tiene un correo válido.");
  let localUser = S.users.find((item) => item.email?.toLowerCase() === email);
  if (!localUser) {
    localUser = {
      id: user.id,
      email,
      nombre: user.user_metadata?.nombre || email,
      rol: S.users.some((item) => item.rol === "admin" || item.role === "admin")
        ? "student"
        : "admin",
    };
    S.users.push(localUser);
    if (!saveData()) {
      S.users.pop();
      return;
    }
    if (localUser.rol === "admin")
      toast("Primera cuenta en este navegador: se asignó el rol de administrador local.");
  }
  S.session = {
    id: user.id,
    email,
    rol: localUser.rol || localUser.role || "student",
    name: localUser.nombre || localUser.name || email,
  };
  await load();
  commit();
}
async function auth(kind) {
  const em = $("#email").value.trim(),
    pw = $("#pw").value,
    err = $("#lerr");
  err.textContent = "";
  if (!authClient) return (err.textContent = authErr);
  if (!/^\S+@\S+\.\S+$/.test(em)) return (err.textContent = "Escribe un correo válido.");
  if (pw.length < 6) return (err.textContent = "La contraseña debe tener al menos 6 caracteres.");
  if (kind === "up") {
    const { data, error } = await authClient.auth.signUp({
      email: em,
      password: pw,
      options: { data: { nombre: em.split("@")[0] } },
    });
    if (error) return (err.textContent = error.message);
    if (!data.session)
      return (err.textContent = "Cuenta creada. Confirma tu correo e inicia sesión.");
    return start(data.user);
  }
  const { data, error } = await authClient.auth.signInWithPassword({ email: em, password: pw });
  if (error) return (err.textContent = "Correo o contraseña incorrectos.");
  start(data.user);
}
A.signup = () => auth("up");
$("#lf").addEventListener("submit", (e) => {
  e.preventDefault();
  auth("in");
});
(async () => {
  if (!authClient) {
    $("#lerr").textContent = authErr;
    return render();
  }
  if (storageError) $("#lerr").textContent = storageError;
  const { data, error } = await authClient.auth.getSession();
  if (error) {
    $("#lerr").textContent = "No se pudo recuperar la sesión: " + error.message;
    return render();
  }
  data.session ? start(data.session.user) : render();
})();
