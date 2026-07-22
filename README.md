# Instituto Técnico Industrial

Sistema web de gestión académica para el Instituto Técnico Industrial.

## 🎯 Características

- **Sitio público**: Inicio, carreras, preinscripción, contacto
- **Sistema multi-rol**: Administrador, Docente, Estudiante
- **Preinscripción online** con envío automático de correos
- **Activación de cuenta por correo electrónico** (token de 48 horas)
- **Gestión de usuarios** (pendientes, aceptados, activos, bloqueados)
- **Biblioteca digital** con subida de archivos (PDF, DOCX, etc.)
- **Cursos, tareas, notas y horarios** para docentes y estudiantes
- **Panel de administración** completo con auditoría

## 🛠️ Tecnologías

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **Prisma ORM** (SQLite / PostgreSQL)
- **Zustand** (estado global)
- **Nodemailer** (envío de correos)
- **bcryptjs + JWT** (autenticación)

## 🚀 Instalación local

### Requisitos
- Node.js 18+
- npm o bun

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/nancyardianov-lab/instituto_tecnico_industrial.git
   cd instituto_tecnico_industrial
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   bun install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   Edita el archivo `.env` con tus valores reales (SMTP, JWT secret, URL).

4. **Generar cliente Prisma y crear base de datos**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **(Opcional) Cargar datos de prueba**
   ```bash
   npx tsx scripts/seed.ts
   ```

6. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```
   Abrir http://localhost:3000

## 📧 Configuración de correo (Gmail)

Para que los correos automáticos (activación de cuenta, notificaciones) funcionen:

1. Activa **verificación en 2 pasos** en tu cuenta de Google
2. Ve a https://myaccount.google.com/apppasswords
3. Genera una contraseña de aplicación (16 caracteres)
4. Colócala en `EMAIL_PASSWORD` del archivo `.env`

## ☁️ Despliegue en producción

### Opción recomendada: Netlify

El proyecto ya está configurado para Netlify (`netlify.toml` incluido).

#### 1. Base de datos PostgreSQL externa

Netlify no incluye base de datos. Crea una gratis en **Neon** (https://neon.tech):
- Crea un proyecto → obtén la cadena de conexión
- Guárdala para el Paso 3: `postgresql://USER:PASSWORD@ep-xxx.neon.tech/iti?sslmode=require`

#### 2. Conectar el repo en Netlify

1. Ve a https://app.netlify.com → **Add new site** → **Import an existing project**
2. Selecciona el repositorio de GitHub
3. Netlify detecta automáticamente la configuración de `netlify.toml`:
   - **Build command**: `npx prisma generate && npx prisma db push --accept-data-loss && next build`
   - **Publish directory**: `.next`
   - **Plugin**: `@netlify/plugin-nextjs` (se instala automáticamente)

#### 3. Configurar variables de entorno

En **Site settings → Environment variables**, agrega:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de PostgreSQL de Neon |
| `JWT_SECRET` | Genera con: `openssl rand -base64 48` |
| `NEXT_PUBLIC_URL` | `https://TU-SITIO.netlify.app` |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `465` |
| `EMAIL_SECURE` | `true` |
| `EMAIL_USER` | Tu correo Gmail |
| `EMAIL_PASSWORD` | Contraseña de aplicación de 16 caracteres |
| `EMAIL_FROM_NAME` | `Instituto Tecnico Industrial` |
| `EMAIL_FROM_ADDRESS` | Tu correo Gmail |

> **Nota**: El `BLOB_READ_WRITE_TOKEN` de Vercel **NO es necesario** en Netlify.
> El proyecto usa **Netlify Blobs** automáticamente para almacenar archivos
> (biblioteca, tareas, entregas) en producción.

#### 4. Desplegar

1. Click en **Deploy site**
2. Espera 3-5 minutos (el primer deploy crea las tablas automáticamente con `prisma db push`)
3. Tu sitio estará en `https://TU-SITIO.netlify.app`

#### 5. Cargar datos iniciales (opcional)

Para cargar datos de prueba en la base de datos de producción:
```bash
# Localmente, con DATABASE_URL apuntando a Neon:
DATABASE_URL="postgresql://...neon..." npx tsx scripts/seed.ts
```

### Almacenamiento de archivos en Netlify

- **Desarrollo local**: archivos en `/public/uploads/` (sistema de archivos)
- **Producción (Netlify)**: **Netlify Blobs** (persistente, automático)
- Las URLs de archivos en producción siguen el formato `/api/blob/{tipo}/{nombre}`
- Límite por archivo: **5 MB** (límite seguro para Netlify Functions)

### Opción alternativa: Railway

1. Sube el código a GitHub
2. Conecta el repo en https://railway.app
3. Configura las variables de entorno
4. Cambia `NEXT_PUBLIC_URL` a tu URL pública de Railway
5. Agrega un volumen persistente en `/app/db` para SQLite

## 📁 Estructura del proyecto

```
src/
├── app/
│   ├── api/              # Endpoints REST
│   │   ├── auth/         # Login, registro, activación
│   │   ├── admin/        # APIs del panel admin
│   │   ├── docente/      # APIs del panel docente
│   │   ├── estudiante/   # APIs del panel estudiante
│   │   └── biblioteca/   # Recursos de biblioteca
│   ├── page.tsx          # Router principal
│   └── layout.tsx
├── components/
│   ├── public/           # Vistas públicas
│   ├── estudiante/       # Panel estudiante
│   ├── docente/          # Panel docente
│   ├── admin/            # Panel admin
│   └── layout/           # Header, Footer
└── lib/
    ├── auth.ts           # JWT y sesiones
    ├── db.ts             # Conexión Prisma
    ├── email.ts          # Envío de correos
    └── store.ts          # Estado Zustand

prisma/
└── schema.prisma         # Esquema de la base de datos
```

## 👥 Roles y permisos

| Rol | Acceso |
|---|---|
| **Visitante** | Páginas públicas, preinscripción, solicitud de cuenta docente |
| **Estudiante** | Panel propio: notas, tareas, biblioteca, horario, perfil |
| **Docente** | Panel propio: cursos, tareas, notas, biblioteca, horario |
| **Administrador** | Control total: usuarios, contenido, plantillas, reportes |

## 🔐 Flujo de activación de cuenta

1. Usuario completa preinscripción / solicitud
2. Administrador aprueba → estado `ACEPTADO` + se genera token
3. Sistema envía correo con enlace de activación (válido 48 horas)
4. Usuario hace clic en el enlace y crea su contraseña
5. Estado pasa a `ACTIVO` → ya puede iniciar sesión

## 📝 Licencia

Proyecto privado para el Instituto Técnico Industrial.
