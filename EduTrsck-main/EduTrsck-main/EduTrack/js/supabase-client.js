/* Cliente de Supabase Auth. Los datos académicos se guardan en JSON local. */
const {
  url: SUPABASE_URL = "https://tdxqygfcinbwmfiehirl.supabase.co",
  key: SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeHF5Z2ZjaW5id21maWVoaXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjExNzQsImV4cCI6MjEwODE5NzE3NH0.JajOOEVCsZWMB9iYJG5-XZMqpeZ8Ks1_OjweQ3dA4RU",
} = window.EDUTRACK_CONFIG || {};
const KEY = "edutrack:ui",
  $ = (s) => document.querySelector(s);
let authClient = null,
  authErr = "";
const jwtRole = (k) => {
  try {
    return JSON.parse(atob(k.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).role;
  } catch (e) {
    return "";
  }
};
try {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw "falta";
  if (/^sb_secret_/.test(SUPABASE_KEY) || jwtRole(SUPABASE_KEY) === "service_role") throw "secreta";
  authClient = window.supabase.createClient(SUPABASE_URL.trim(), SUPABASE_KEY.trim());
} catch (e) {
  authErr =
    e === "falta"
      ? "No se encontró la configuración. Pon config.js en la misma carpeta que index.html."
      : e === "secreta"
        ? "config.js tiene una clave secreta. Usa la clave pública (anon o publishable)."
        : window.supabase
          ? "La URL o la clave de Supabase no son válidas. Revisa config.js."
          : "No cargó la librería de Supabase. Revisa tu conexión a internet.";
}
