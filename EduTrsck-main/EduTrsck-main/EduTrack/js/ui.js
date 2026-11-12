/* UI base: toasts, modales, formularios y eventos globales */
function toast(m) {
  const t = document.createElement("div");
  t.className = "ts";
  t.textContent = m;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3200);
}
let lastFocus;
function modal(title, body, mount) {
  closeModal(false);
  lastFocus = document.activeElement;
  $("#modal").innerHTML =
    `<div class="ov"><div class="md" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="row"><h2 id="mt" style="font-size:18px">${esc(title)}</h2><button data-act="close" aria-label="Cerrar">✕</button></div><div style="margin-top:12px">${body}</div></div></div>`;
  mount?.($("#modal"));
  ($("#modal input,#modal select,#modal textarea") || $("#modal .p") || $("#modal button")).focus();
}
function closeModal(back = true) {
  $("#modal").innerHTML = "";
  if (back) lastFocus?.focus?.();
}
function formModal(title, fields, onSubmit, label = "Guardar") {
  modal(
    title,
    `<form id="f">${fields}<div class="row end"><button type="button" data-act="close">Cancelar</button><button class="p">${label}</button></div></form>`,
    (r) =>
      r.querySelector("#f").addEventListener("submit", (e) => {
        e.preventDefault();
        const err = onSubmit(new FormData(e.target));
        if (err) toast(err);
      }),
  );
}
const fld = (l, n, v = "", a = "") =>
  `<label>${l}<input name="${n}" value="${esc(v)}" ${a}></label>`;
document.addEventListener("keydown", (e) => {
  if (!$("#modal .md")) return;
  if (e.key === "Escape") return closeModal();
  if (e.key === "Tab") {
    const f = [...$("#modal .md").querySelectorAll("button,input,select,textarea")].filter(
      (x) => !x.disabled,
    );
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) {
      e.preventDefault();
      f.at(-1).focus();
    } else if (!e.shiftKey && i === f.length - 1) {
      e.preventDefault();
      f[0].focus();
    }
  }
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ov")) return closeModal();
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const v = b.dataset.id;
  A[b.dataset.act]?.(/^\d+$/.test(v || "") ? +v : v, b);
});
