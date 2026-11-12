# EduTrack
Plataforma educativa para seguimiento y evaluación académica.

## Almacenamiento

La aplicación de `EduTrack/` guarda grupos, clases, alumnos, actividades, mensajes, calificaciones, asistencia y roles como JSON en el almacenamiento local del navegador. La información no se envía a una base de datos y no se comparte automáticamente entre equipos.

Supabase Auth solo verifica el correo y la contraseña; la aplicación ya no consulta las tablas académicas de Supabase. En un navegador vacío, la primera cuenta autenticada se registra como administradora local. Desde **Ajustes** se pueden asignar roles y descargar respaldos JSON; un respaldo también se puede importar desde la pantalla de inicio de sesión para preparar otro navegador.

Los cambios se guardan automáticamente en el navegador; descarga respaldos con regularidad. La plantilla vacía `EduTrack/respaldo-edutrack-plantilla.json` se puede importar desde el inicio de sesión para preparar el almacenamiento local. Para compartir clases, mensajes y otros cambios entre equipos, importa el respaldo JSON actualizado en cada uno. Los roles y datos locales solo aplican a ese navegador y no son un mecanismo de autorización seguro para información sensible. Las cuentas nuevas en Supabase Auth deben tener un rol local asignado por el administrador.
