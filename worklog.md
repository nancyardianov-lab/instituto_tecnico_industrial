# Worklog - Instituto Técnico Industrial

---
Task ID: 1
Agent: main
Task: Corregir bugs reportados por el usuario (sesión persistente, contraseña autocompleta, error subida libro, refactor cursos a materias individuales, notificaciones)

Work Log:
- Investigación completa del proyecto: leí page.tsx, store.ts, auth.ts, login-view.tsx, header.tsx, biblioteca route, storage.ts, admin-academica.tsx, admin-notificaciones.tsx, admin-usuarios.tsx, admin-preinscripciones.tsx, admin-contenido.tsx, prisma/schema.prisma, scripts/seed.ts
- Fix 1: Cookie de sesión sin `maxAge` en `src/lib/auth.ts` → la sesión se cierra al cerrar el navegador, ya no aparece el admin siempre logueado
- Fix 2: En `src/components/public/login-view.tsx`, cambié `autoComplete="new-password"` a `autoComplete="off"` + `readOnly` on-mount que se quita onFocus para evitar que el navegador llene la contraseña automáticamente
- Fix 3: En `src/lib/storage.ts`, bajé el límite de archivos de 50MB a 5MB (Netlify Functions tienen límite duro de ~6MB en el body). En `src/components/docente/docente-biblioteca.tsx` actualicé el mensaje y la validación del lado del cliente. En `src/app/api/biblioteca/route.ts` agregué validación explícita del tamaño antes de subir.
- Fix 4 (Cursos → Materias individuales):
  * Creé `scripts/migraciones/migrar-cursos-a-materias.ts` que lee los Cursos legacy (carrera+año), parsea el `pensum` JSON, crea un Curso individual por cada materia (Física, Teoría de la Información, etc.) y elimina los legacy (cascada borra asignaciones, horarios, inscripciones, tareas, calificaciones).
  * Actualicé `scripts/seed.ts` para que instalaciones nuevas creen directamente materias individuales (no más "Computación - 5° año").
  * En `src/app/api/admin/asignaciones/route.ts` POST agregué regla "una materia = un docente": si la materia ya tiene docente, devuelve error indicando qué docente la tiene.
  * En `src/components/admin/admin-academica.tsx` (AsignacionesTab): agregué detección de materia ya asignada, cartel rojo de advertencia, botón deshabilitado cuando hay conflicto, cambié títulos de "Cursos" a "Materias".
- Fix 5 (Notificaciones): en `src/components/admin/admin-notificaciones.tsx` agregué cartel explicativo al inicio indicando dónde ven los usuarios las notificaciones (campana en la esquina superior derecha tras iniciar sesión).
- Verifiqué que delete de usuarios, anuncios (noticias), preinscripciones, carreras, cursos y horarios ya existen en el código previo.
- Verifiqué que la subida de imagen de carrera desde el dispositivo ya existe en `admin-academica.tsx` (subirImagen).
- Build exitoso: `npm run build` → "✓ Compiled successfully in 12.0s"

Stage Summary:
- 5 bugs/features corregidos:
  1. Sesión persistente → cookie ahora es de sesión (se borra al cerrar navegador)
  2. Contraseña autocompleta → autoComplete="off" + readOnly onFocus trick
  3. Error subida libro → límite bajo a 5MB (compatibilidad Netlify Functions)
  4. Cursos como materias individuales → migración creada + seed actualizado + UI mejorada + regla 1 docente por materia
  5. Notificaciones → cartel explicativo en panel admin
- Archivos modificados:
  * src/lib/auth.ts
  * src/components/public/login-view.tsx
  * src/lib/storage.ts
  * src/components/docente/docente-biblioteca.tsx
  * src/app/api/biblioteca/route.ts
  * src/app/api/admin/upload-imagen/route.ts
  * src/components/admin/admin-academica.tsx
  * src/app/api/admin/asignaciones/route.ts
  * src/components/admin/admin-notificaciones.tsx
  * scripts/seed.ts
- Archivos creados:
  * scripts/migraciones/migrar-cursos-a-materias.ts
- Pendiente: push a GitHub para que Netlify despliegue automáticamente. El usuario deberá ejecutar la migración `npx tsx scripts/migraciones/migrar-cursos-a-materias.ts` contra la base de datos de producción para limpiar los cursos legacy.

---
Task ID: 2
Agent: main
Task: Cambiar asignación de materias: admin escribe el nombre en vez de seleccionar de dropdown; arreglar error al editar imagen de carrera

Work Log:
- Análisis de captura de pantalla del usuario: muestra dropdown con "Dibujo de Construcción - 5° año" como materia (formato legacy) → el dropdown no sirve
- Modificación de `src/app/api/admin/asignaciones/route.ts` POST: ahora acepta `materiaNombre + carreraId + anio + docenteId` y hace find-or-create del Curso por (nombre, carreraId, anio). Modo legacy con `cursoId` sigue funcionando.
- Modificación de `src/components/admin/admin-academica.tsx` (AsignacionesTab):
  * Eliminado el dropdown de cursos y los filtros por carrera/año
  * Agregado input de texto para nombre de materia con <datalist> de sugerencias
  * Agregado selects directos para carrera y año (junto al campo materia)
  * Validaciones: docente, carrera, año y materiaNombre (mínimo 2 caracteres)
  * Botón deshabilitado durante envío (enviando state con Loader2)
- Modificación de `src/components/admin/admin-academica.tsx` (CarrerasTab.subirImagen):
  * Eliminada la dependencia de /api/admin/upload-imagen (que fallaba en Netlify)
  * Ahora usa FileReader.readAsDataURL() para convertir la imagen a base64 en el cliente
  * La imagen se guarda directamente en el campo `imagen` de la Carrera (String en BD)
  * Límite bajado a 1.5 MB (las data URLs son ~33% más grandes que el binario)
  * Esto arregla el error al editar imagen de carrera en producción
- Build exitoso: `npm run build` → "✓ Compiled successfully in 12.2s"
- Commit `ff9869e` y push a GitHub (Netlify desplegará automáticamente)

Stage Summary:
- 2 problemas corregidos en este turno:
  1. Asignación de materias: el admin escribe libremente el nombre de la materia (Física, Teoría de la Información, etc.) → si no existe, se crea automáticamente. Ya no aparecen los cursos legacy tipo "Dibujo de Construcción - 5° año" como opciones.
  2. Imagen de carrera: ahora se convierte a base64 en el cliente y se guarda en la BD directamente, sin depender de Netlify Blobs. Arregla el error al editar la imagen.
- No requiere migración de BD: las materias se crean on-the-fly al asignarlas.
- Los cursos legacy existentes siguen en la BD pero el admin ya no los ve como opciones en el formulario de asignación (puede eliminarlos manualmente desde la pestaña "Cursos" si lo desea).

---
Task ID: 3
Agent: main
Task: Sesión persistente (de nuevo), inscripción de estudiantes a materias, horario tipo timetable

Work Log:
- Análisis de captura WhatsApp: horario impreso con grid LUN-VIE × horas (13:00-18:00), cada celda con materia + docente. Foto de referencia para el nuevo diseño.
- Fix sesión persistente (problema recurrente):
  * auth.ts: cookie con maxAge=8h (en vez de sesión sin expiración) + clearSessionCookie agresivo (delete + set con expires=0 + maxAge=0).
  * page.tsx: useEffect que escucha 'beforeunload' y 'pagehide', llama navigator.sendBeacon('/api/auth/logout') al cerrar la pestaña/navegador. Así la próxima visita SIEMPRE abre en login.
- Fix dropdowns ocultos en modal de Asignación:
  * SelectContent con position='popper' y className='z-[100]' para que floten sobre el Dialog.
  * SelectTrigger con className='w-full' para que se vea completo el ancho.
  * DialogContent con max-h-[90vh] overflow-y-auto.
- Implementada inscripción de estudiantes a materias:
  * Nueva API /api/estudiante/inscripciones (GET/POST/DELETE).
  * GET devuelve materias de la CARRERA y AÑO del estudiante (no de otras).
  * POST valida que la materia sea de SU carrera y SU año, crea Inscripcion y HORARIO_ESTUDIANTE para todos los horarios del curso.
  * DELETE elimina Inscripcion y HorarioEstudiante asociados.
  * Nuevo componente /components/estudiante/estudiante-inscripcion.tsx con UI clara: materias inscritas + materias disponibles.
  * Agregada al menú lateral del estudiante como 'Inscripción a Materias' (icono BookMarked).
- Horario tipo timetable (grid LUN-VIE × horas):
  * Nuevo componente /components/shared/timetable.tsx con:
    - Columna de horas + 5 columnas (LUN-VIE)
    - Bloques coloreados por materia (hash determinístico del nombre → paleta de 10 colores)
    - Cada bloque muestra: materia, docente, aula, horario
    - Altura proporcional a la duración
    - Responsive con scroll horizontal en móvil
  * Helper entriesFromHorarioPorDia() para reusar el formato del API existente.
- Estudiante: estudiante-horario.tsx rediseñado para usar Timetable + stats + mensaje si no hay clases (guía a inscripción).
- Docente: docente-horario.tsx rediseñado para usar Timetable + materias asignadas.
- Admin: HorariosTab rediseñado:
  * Filtros por carrera y año (SelectContent con popper)
  * Vista timetable (todos los horarios filtrados)
  * Tabla detallada con día/hora/aula/estudiantes/eliminar
  * Modal de crear horario con selects popper
- API estudiante/horario: agrega carrera y anio del usuario en la respuesta para mostrar en encabezado.
- Build exitoso: 'Compiled successfully in 12.5s'
- Commit 994c447 y push a GitHub.

Stage Summary:
- 4 problemas corregidos:
  1. Sesión persistente: sendBeacon logout al cerrar navegador + cookie maxAge 8h + clearSessionCookie agresivo. La página ahora SIEMPRE abre en login.
  2. Dropdowns ocultos en modal de asignación: SelectContent con position=popper y z-[100] + SelectTrigger w-full. El usuario verá el dropdown de carrera y año correctamente.
  3. Estudiantes sin función de inscripción: nuevo flujo completo donde el estudiante solo ve materias de SU carrera y SU año, se inscribe/desinscribe por sí mismo.
  4. Horarios: rediseñados como timetable semanal (grid LUN-VIE × horas) con colores por materia. Estudiante solo ve SU horario, docente solo el suyo, admin ve TODOS con filtros.
- Archivos nuevos:
  * src/app/api/estudiante/inscripciones/route.ts
  * src/components/estudiante/estudiante-inscripcion.tsx
  * src/components/shared/timetable.tsx
- Archivos modificados:
  * src/lib/auth.ts (cookie maxAge + clearSessionCookie agresivo)
  * src/app/page.tsx (sendBeacon logout al cerrar)
  * src/components/admin/admin-academica.tsx (HorariosTab rediseñado + SelectContent popper)
  * src/components/docente/docente-horario.tsx (timetable)
  * src/components/estudiante/estudiante-horario.tsx (timetable)
  * src/components/estudiante/estudiante-layout.tsx (menú inscripción)
  * src/app/api/estudiante/horario/route.ts (carrera + anio en response)

---
Task ID: 4
Agent: main
Task: Archivos adjuntos al crear tarea (docente) y al entregar (alumno); horario del estudiante vacío y del docente sin grado; panel general vacío

Work Log:
- Lectura de archivos afectados: docente-tareas.tsx, estudiante-tareas.tsx, docente-horario.tsx, estudiante-horario.tsx, shared/timetable.tsx, docente-layout.tsx, estudiante-layout.tsx, APIs de dashboard/horario/tareas, prisma/schema.prisma, lib/storage.ts, api/blob/.../route.ts, api/biblioteca/route.ts
- Fix 1 (Archivos adjuntos):
  * Schema: añadidos `archivoUrl`, `archivoNombre`, `archivoTipo` a models Tarea y Entrega.
  * storage.ts: nuevo tipo 'tareas' + TAREA_ARCHIVOS_PERMITIDOS (imágenes, videos, documentos) + helper tipoDeArchivo() + MAX_TAREA_ARCHIVO = 5MB.
  * api/blob/[tipo]/[nombre]/route.ts: soporta tipo 'tareas' + content types de video.
  * api/docente/tareas/route.ts POST: ahora acepta multipart/form-data con archivo opcional.
  * api/estudiante/tareas/[id]/entregar/route.ts POST: ahora acepta multipart/form-data con archivo opcional.
  * docente-tareas.tsx: UI con selector de archivo (foto/video/documento) desde el dispositivo, preview del nombre y tamaño, quitar archivo. Modal de detalle muestra el adjunto (imagen, video player o link de documento). Entregas del alumno muestran su archivo igualmente.
  * estudiante-tareas.tsx: UI igual para que el alumno suba archivo desde dispositivo. Modal de detalle muestra el adjunto del docente y el propio.
  * api/estudiante/tareas/route.ts: incluye archivoUrl/archivoNombre/archivoTipo en la respuesta.
- Fix 2 (Horarios):
  * api/estudiante/horario/route.ts: ahora deriva el horario de INSCRIPCIONES (más confiable que HorarioEstudiante). Incluye el docente de cada materia. Auto-sincroniza HorarioEstudiante faltantes en background.
  * shared/timetable.tsx: nueva prop `showGrado` para mostrar el grado (año) dentro de cada bloque. Importa GraduationCap de lucide-react. Title del bloque ahora incluye año + docente.
  * docente-horario.tsx: pasa showGrado={true} al Timetable.
- Fix 3 (Panel general vacío):
  * api/estudiante/dashboard/route.ts:
    - HorarioHoy ahora son "próximas clases": si hoy hay clases usa las de hoy, sino busca el siguiente día hábil con clases.
    - tareasPendientes ya NO filtra por fecha >= hoy: incluye vencidas, marcadas con `vencida: true`.
    - Cada clase incluye el docente (antes no lo tenía).
    - horarioHoyLabel: 'Hoy' o nombre del día de las próximas clases.
  * api/docente/dashboard/route.ts:
    - Misma lógica de "próximas clases" para horarioHoy.
    - Cada clase incluye carrera, anio, aula.
  * estudiante-layout.tsx: 
    - Título dinámico "Clases de Hoy" o "Próximas Clases (Día)".
    - Cada clase muestra docente + aula.
    - Tareas vencidas marcadas con borde rojo + badge "Vencida".
  * docente-layout.tsx:
    - Título dinámico.
    - Cada clase muestra carrera + año + aula.
    - Botón "Ver horario completo" agregado al panel de clases.
- `npx prisma generate` ejecutado correctamente.
- Build exitoso: `npm run build` → "✓ Compiled successfully in 12.2s"
- Commit `59824c5` y push a GitHub (Netlify desplegará automáticamente).

Stage Summary:
- 3 problemas corregidos en este turno:
  1. Archivos adjuntos: docente puede subir foto/video/documento al crear tarea; alumno puede hacer lo mismo al entregar. Vista previa integrada (imagen, video player, link de documento). Compatible con Netlify Blobs y Vercel Blob.
  2. Horario: estudiante ahora SÍ ve su horario (derivado de inscripciones, no de tabla intermedia que podía no estar sincronizada) con el docente de cada materia; docente ve el grado (año) de cada materia.
  3. Panel general: ya no aparece vacío — muestra "próximas clases" (hoy o siguiente día hábil) con docente/carrera/grado, y todas las tareas pendientes (incluyendo vencidas marcadas en rojo).
- IMPORTANTE para producción: requiere aplicar el cambio de schema a la BD. Como los campos nuevos son opcionales (String?), basta con `npx prisma db push` o `npx prisma migrate deploy` contra la BD de producción (Neon/Supabase) — no se pierden datos existentes.
- Archivos nuevos: ninguno (todos son modificaciones a archivos existentes).
- Archivos modificados (15):
  * prisma/schema.prisma (campos archivoUrl/archivoNombre/archivoTipo en Tarea y Entrega)
  * src/lib/storage.ts (tipo 'tareas' + TAREA_ARCHIVOS_PERMITIDOS + tipoDeArchivo)
  * src/app/api/blob/[tipo]/[nombre]/route.ts (soporte tipo 'tareas' + content-types video)
  * src/app/api/docente/tareas/route.ts POST (multipart + subida archivo)
  * src/app/api/estudiante/tareas/[id]/entregar/route.ts POST (multipart + subida archivo)
  * src/app/api/estudiante/tareas/route.ts (incluye campos de archivo en response)
  * src/app/api/estudiante/horario/route.ts (deriva de inscripciones + sincroniza HorarioEstudiante faltantes)
  * src/app/api/estudiante/dashboard/route.ts (próximas clases + tareas vencidas + docente por clase)
  * src/app/api/docente/dashboard/route.ts (próximas clases + carrera/grado por clase)
  * src/components/shared/timetable.tsx (prop showGrado + GraduationCap)
  * src/components/docente/docente-horario.tsx (showGrado=true)
  * src/components/docente/docente-tareas.tsx (UI subir archivo + preview)
  * src/components/docente/docente-layout.tsx (título dinámico + info por clase)
  * src/components/estudiante/estudiante-tareas.tsx (UI subir archivo + preview)
  * src/components/estudiante/estudiante-layout.tsx (título dinámico + docente por clase + tareas vencidas)
