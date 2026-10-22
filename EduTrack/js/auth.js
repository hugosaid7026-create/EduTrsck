/* Login con Supabase Auth e inicio de la app */
async function start(user) {
  const { data: p, error } = await db
    .from("perfiles")
    .select("nombre,rol,email")
    .eq("id", user.id)
    .single();
  if (error) return ($("#lerr").textContent = "No se encontró tu perfil: " + error.message);
  S.session = {
    id: user.id,
    email: p.email || user.email,
    rol: p.rol,
    name: p.nombre || user.email,
  };
  await load();
  commit();
}
async function auth(kind) {
  const em = $("#email").value.trim(),
    pw = $("#pw").value,
    err = $("#lerr");
  err.textContent = "";
  if (!db) return (err.textContent = dbErr);
  if (!/^\S+@\S+\.\S+$/.test(em)) return (err.textContent = "Escribe un correo válido.");
  if (pw.length < 6) return (err.textContent = "La contraseña debe tener al menos 6 caracteres.");
  if (kind === "up") {
    const { data, error } = await db.auth.signUp({
      email: em,
      password: pw,
      options: { data: { nombre: em.split("@")[0] } },
    });
    if (error) return (err.textContent = error.message);
    if (!data.session)
      return (err.textContent = "Cuenta creada. Confirma tu correo e inicia sesión.");
    return start(data.user);
  }
  const { data, error } = await db.auth.signInWithPassword({ email: em, password: pw });
  if (error) return (err.textContent = "Correo o contraseña incorrectos.");
  start(data.user);
}
A.signup = () => auth("up");
$("#lf").addEventListener("submit", (e) => {
  e.preventDefault();
  auth("in");
});
(async () => {
  if (!db) {
    $("#lerr").textContent = dbErr;
    return render();
  }
  const { data } = await db.auth.getSession();
  data.session ? start(data.session.user) : render();
})();
