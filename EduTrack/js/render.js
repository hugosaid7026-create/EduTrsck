/* Render principal */
function render() {
  const on = !!S.session;
  document.documentElement.dataset.theme =
    S.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  $("#login").classList.toggle("hidden", on);
  $("#app").classList.toggle("hidden", !on);
  if (!on) return;
  document.body.classList.toggle("student", !(isT() || isAdmin()));
  $("#uname").textContent = S.session.name;
  $("#urole").textContent = isAdmin() ? "Admin" : isT() ? "Docente" : "Estudiante";
  if (!views[S.route]) S.route = "dashboard";
  const R = views[S.route];
  $("#title").textContent = R.t;
  $("#view").innerHTML = R.f();
  R.m?.();
  document
    .querySelectorAll("[data-act=nav]")
    .forEach((b) => b.setAttribute("aria-current", b.dataset.id === S.route ? "page" : "false"));
}
