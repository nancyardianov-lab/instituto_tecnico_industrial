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
