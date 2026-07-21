// Seed completo del Instituto Técnico Industrial
// Crea: carreras, cursos, materias, usuarios demo, noticias, plantillas, etc.

import { PrismaClient, UserRole, UserStatus, PreinscripcionStatus, PlantillaTipo, LibroCategoria, NotificacionTipo } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // ===============================================
  // 1. PLANTILLAS DE CORREO
  // ===============================================
  console.log('📧 Creando plantillas de correo...')
  const plantillas = [
    {
      tipo: PlantillaTipo.PREINSCRIPCION_RECIBIDA,
      asunto: 'Solicitud de Preinscripción Recibida - Instituto Técnico Industrial',
      contenido: `Estimado/a {{estudianteNombre}},

Hemos recibido correctamente su solicitud de preinscripción para la carrera de {{carreraNombre}} en el Instituto Técnico Industrial.

Su solicitud será revisada por el equipo administrativo en los próximos días. Una vez revisada, recibirá una notificación por correo electrónico indicando el estado de su solicitud.

Datos registrados:
- Estudiante: {{estudianteNombre}}
- Carrera: {{carreraNombre}}
- Código: {{estudianteCodigo}}

Si necesita realizar alguna corrección o tiene preguntas, puede contactarnos al teléfono 7760-2670 o al correo tecnicoindustrial@gmail.com.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial\n7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos\nTel: 7760-2670 | tecnicoindustrial@gmail.com',
      informacionContacto: 'Teléfono: 7760-2670 | Correo: tecnicoindustrial@gmail.com',
    },
    {
      tipo: PlantillaTipo.PREINSCRIPCION_ACEPTADA,
      asunto: '¡Felicidades! Preinscripción Aceptada - Instituto Técnico Industrial',
      contenido: `Estimado/a {{estudianteNombre}},

¡Felicidades! Su solicitud de preinscripción para la carrera de {{carreraNombre}} ha sido ACEPTADA.

Para completar su inscripción, debe presentarse presencialmente al instituto con la siguiente documentación:

DOCUMENTOS REQUERIDOS:
1. Certificado de estudios de nivel básico
2. Diploma de graduación de nivel básico
3. Fotocopia de cédula de identidad del estudiante
4. Fotocopia de cédula de identidad del padre/encargado
5. Certificado de nacimiento
6. Certificado de salud
7. 2 fotografías tamaño cédula
8. Constancia de no antecedentes penales (mayores de edad)

FECHA Y HORA: {{fechaInscripcion}}
LUGAR: Instituto Técnico Industrial, 7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos
Oficina de Registro y Control, planta baja.

RECOMENDACIONES IMPORTANTES:
- Llegar 15 minutos antes de la hora asignada
- Traer originales y copias de todos los documentos
- Verificar que los documentos estén vigentes
- En caso de no poder asistir, comunicarse al teléfono 7760-2670

Una vez confirmada su inscripción presencial, recibirá un nuevo correo con instrucciones para activar su cuenta en el sistema.

Atentamente,
Administración - Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial\n7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos\nTel: 7760-2670 | tecnicoindustrial@gmail.com',
      documentosSolicitados: '["Certificado de estudios básicos","Diploma de graduación básica","Fotocopia cédula estudiante","Fotocopia cédula padre/encargado","Certificado de nacimiento","Certificado de salud","2 fotografías tamaño cédula","Constancia de no antecedentes penales"]',
      informacionContacto: 'Teléfono: 7760-2670 | Correo: tecnicoindustrial@gmail.com',
      fechaLimite: '7 días hábiles desde la recepción de este correo',
    },
    {
      tipo: PlantillaTipo.PREINSCRIPCION_RECHAZADA,
      asunto: 'Actualización de su Solicitud de Preinscripción',
      contenido: `Estimado/a {{estudianteNombre}},

Le informamos que su solicitud de preinscripción para la carrera de {{carreraNombre}} ha sido revisada y lamentablemente no ha sido aceptada en esta ocasión.

Motivo: {{notasRevision}}

Si desea presentar una nueva solicitud en el próximo ciclo, le recomendamos revisar los requisitos y volver a aplicar.

Para cualquier consulta, puede comunicarse al teléfono 7760-2670 o al correo tecnicoindustrial@gmail.com.

Atentamente,
Administración - Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial\n7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos\nTel: 7760-2670 | tecnicoindustrial@gmail.com',
      informacionContacto: 'Teléfono: 7760-2670 | Correo: tecnicoindustrial@gmail.com',
    },
    {
      tipo: PlantillaTipo.DOCUMENTACION_INCOMPLETA,
      asunto: 'Documentación Incompleta - Preinscripción',
      contenido: `Estimado/a {{estudianteNombre}},

Hemos revisado su solicitud de preinscripción para la carrera de {{carreraNombre}} y necesitamos que complete la siguiente información/documentación:

{{notasRevision}}

Por favor, regularice su situación lo antes posible para continuar con el proceso de inscripción.

Para cualquier consulta, comuníquese al teléfono 7760-2670.

Atentamente,
Administración - Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial\n7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos\nTel: 7760-2670',
    },
    {
      tipo: PlantillaTipo.INSCRIPCION_CONFIRMADA,
      asunto: 'Inscripción Confirmada - Active su Cuenta',
      contenido: `Estimado/a {{estudianteNombre}},

¡Bienvenido/a al Instituto Técnico Industrial!

Su inscripción presencial ha sido confirmada exitosamente. Su cuenta en el sistema académico ha sido habilitada.

Para comenzar a usar el sistema, active su cuenta creando su contraseña personal:

ENLACE DE ACTIVACIÓN: {{enlaceActivacion}}

Este enlace expirará en 48 horas. Una vez activada su cuenta, podrá:
- Ver sus cursos y horarios
- Consultar sus notas
- Acceder a la biblioteca virtual
- Recibir y entregar tareas
- Recibir notificaciones del instituto

Sus datos de acceso:
- Usuario: {{estudianteEmail}}
- Código: {{estudianteCodigo}}

Si tiene problemas para activar su cuenta, contacte al administrador del sistema.

Atentamente,
Administración - Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial\n7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos\nTel: 7760-2670',
    },
    {
      tipo: PlantillaTipo.ACTIVACION_CUENTA,
      asunto: 'Cuenta Activada Exitosamente',
      contenido: `Estimado/a {{nombre}},

Su cuenta en el sistema del Instituto Técnico Industrial ha sido activada exitosamente.

Ya puede iniciar sesión con su correo electrónico y contraseña en nuestro portal académico.

Le recomendamos mantener sus datos actualizados y revisar regularmente sus notificaciones.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
    {
      tipo: PlantillaTipo.DOCENTE_APROBADO,
      asunto: 'Solicitud de Cuenta Docente Aprobada',
      contenido: `Estimado/a {{nombre}},

Su solicitud para crear una cuenta como docente en el Instituto Técnico Industrial ha sido aprobada.

Para activar su cuenta y crear su contraseña, utilice el siguiente enlace:

{{enlaceActivacion}}

Bienvenido/a a nuestro equipo docente.

Atentamente,
Administración - Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
    {
      tipo: PlantillaTipo.DOCENTE_RECHAZADO,
      asunto: 'Actualización de su Solicitud de Cuenta Docente',
      contenido: `Estimado/a {{nombre}},

Le informamos que su solicitud de cuenta como docente no ha sido aprobada en esta ocasión.

Motivo: {{notasRevision}}

Para más información, comuníquese con la administración del instituto.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
    {
      tipo: PlantillaTipo.TAREA_NUEVA,
      asunto: 'Nueva Tarea Asignada: {{tareaTitulo}}',
      contenido: `Estimado/a {{nombre}},

Se le ha asignado una nueva tarea:

TAREA: {{tareaTitulo}}
CURSO: {{cursoNombre}}
FECHA DE ENTREGA: {{fechaEntrega}}
PUNTEO MÁXIMO: {{punteoMaximo}} puntos

DESCRIPCIÓN:
{{tareaDescripcion}}

Ingrese al sistema para ver más detalles y realizar su entrega.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
    {
      tipo: PlantillaTipo.NOTA_PUBLICADA,
      asunto: 'Nueva Calificación Publicada',
      contenido: `Estimado/a {{nombre}},

Se ha publicado una nueva calificación:

CURSO: {{cursoNombre}}
UNIDAD: {{unidad}}
NOTA: {{nota}}

Puede ver el detalle en su panel de estudiante.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
    {
      tipo: PlantillaTipo.RESTABLECER_CONTRASENA,
      asunto: 'Restablecimiento de Contraseña',
      contenido: `Estimado/a {{nombre}},

Hemos recibido una solicitud para restablecer su contraseña.

Para crear una nueva contraseña, utilice el siguiente enlace:

{{enlaceRestablecimiento}}

Este enlace expirará en 1 hora. Si usted no solicitó este cambio, ignore este correo.

Atentamente,
Instituto Técnico Industrial`,
      firma: 'Instituto Técnico Industrial',
    },
  ]

  for (const p of plantillas) {
    await prisma.plantillaCorreo.upsert({
      where: { tipo: p.tipo },
      update: p,
      create: p,
    })
  }
  console.log(`✓ ${plantillas.length} plantillas de correo creadas`)

  // ===============================================
  // 2. CARRERAS Y CURSOS
  // ===============================================
  console.log('🎓 Creando carreras...')

  const carreras = [
    {
      nombre: 'Bachillerato Industrial y Perito en Computación',
      slug: 'computacion',
      descripcion: 'Esta carrera está orientada a la formación de profesionales con conocimientos en informática, programación, redes de computadoras, arquitectura del computador, análisis de sistemas y desarrollo de software. A lo largo de la formación, los estudiantes adquieren habilidades para diseñar, desarrollar y administrar soluciones tecnológicas, fortaleciendo además competencias en matemáticas, electrónica y organización empresarial. Es una opción ideal para quienes tienen interés en la tecnología, la innovación y la resolución de problemas mediante herramientas informáticas.',
      objetivo: 'Formar técnicos profesionales competentes en el diseño, desarrollo y administración de soluciones informáticas, capaces de integrarse al mercado laboral en áreas de programación, redes, soporte técnico y análisis de sistemas, o continuar estudios universitarios en áreas afines.',
      perfilEgresado: 'El egresado será capaz de: diseñar y desarrollar software en diferentes lenguajes de programación; administrar redes de computadoras; realizar mantenimiento preventivo y correctivo de equipos; analizar y diseñar sistemas de información; aplicar bases de datos en soluciones tecnológicas; gestionar proyectos informáticos; y adaptarse rápidamente a los cambios tecnológicos.',
      campoLaboral: 'Empresas de desarrollo de software, departamentos de TI en empresas públicas y privadas, centros de soporte técnico, empresas de redes y telecomunicaciones, banca, industria, comercio, así como emprendimiento propio en servicios tecnológicos.',
      duracion: '3 años',
      imagen: '/carreras/computacion/foto_01.jpeg',
      galeria: JSON.stringify([
        '/carreras/computacion/foto_01.jpeg',
        '/carreras/computacion/foto_02.jpeg',
        '/carreras/computacion/foto_03.jpeg',
        '/carreras/computacion/foto_04.jpeg',
        '/carreras/computacion/foto_05.jpeg',
        '/carreras/computacion/foto_06.jpeg',
        '/carreras/computacion/foto_07.jpeg',
      ]),
    },
    {
      nombre: 'Bachillerato Industrial y Perito en Dibujo de Construcción',
      slug: 'dibujo-construccion',
      descripcion: 'Esta carrera está enfocada en la formación de estudiantes con conocimientos técnicos para la elaboración e interpretación de planos arquitectónicos y de construcción. Durante su preparación desarrollan habilidades en dibujo técnico, diseño, tecnología vocacional, organización de talleres y prácticas especializadas, complementadas con una sólida formación académica. Los egresados están capacitados para colaborar en proyectos de construcción, diseño y planificación, utilizando técnicas y herramientas propias del área.',
      objetivo: 'Formar técnicos especializados en la elaboración, interpretación y supervisión de planos arquitectónicos y de construcción, con capacidad para integrarse a proyectos de obra civil, diseño arquitectónico y planificación urbana.',
      perfilEgresado: 'El egresado será capaz de: elaborar planos arquitectónicos y estructurales utilizando software especializado (AutoCAD); interpretar planos de construcción; aplicar normas técnicas de dibujo; colaborar con arquitectos e ingenieros en proyectos de construcción; diseñar espacios funcionales; y supervisar la ejecución de obras según los planos aprobados.',
      campoLaboral: 'Oficinas de arquitectura e ingeniería, empresas constructoras, municipalidades, ministerios (Comunicaciones, Infraestructura), proyectos urbanísticos, así como consultoría independiente en diseño y elaboración de planos.',
      duracion: '3 años',
      imagen: '/carreras/dibujo/foto_01.jpeg',
      galeria: JSON.stringify([
        '/carreras/dibujo/foto_01.jpeg',
        '/carreras/dibujo/foto_02.jpeg',
        '/carreras/dibujo/foto_03.jpeg',
        '/carreras/dibujo/foto_04.jpeg',
        '/carreras/dibujo/foto_05.jpeg',
        '/carreras/dibujo/foto_06.jpeg',
        '/carreras/dibujo/foto_07.jpeg',
        '/carreras/dibujo/foto_08.jpeg',
        '/carreras/dibujo/foto_09.jpeg',
        '/carreras/dibujo/foto_10.jpeg',
        '/carreras/dibujo/foto_11.jpeg',
        '/carreras/dibujo/foto_12.jpeg',
      ]),
    },
    {
      nombre: 'Bachillerato Industrial y Perito en Costura Industrial',
      slug: 'costura-industrial',
      descripcion: 'Esta carrera está orientada a la formación de estudiantes en el diseño, confección y elaboración de prendas de vestir, utilizando técnicas de patronaje, corte y costura con estándares de calidad. Durante su formación desarrollan habilidades para el manejo de maquinaria especializada, selección de materiales, control de calidad y emprendimiento, preparándose para desempeñarse en la industria textil o crear su propio negocio.',
      objetivo: 'Formar técnicos competentes en el diseño, patronaje, corte y confección de prendas de vestir, capaces de integrarse a la industria textil, liderar procesos productivos o desarrollar su propio emprendimiento en el área de la confección.',
      perfilEgresado: 'El egresado será capaz de: diseñar y patronar prendas de vestir; operar maquinaria industrial de confección; aplicar técnicas de corte y ensamblaje; controlar la calidad de productos textiles; gestionar talleres de confección; administrar inventarios de materiales; y desarrollar modelos propios para comercialización.',
      campoLaboral: 'Maquilas y fábricas textiles, talleres de confección, empresas de uniformes, diseñadores independientes, tiendas de moda, así como emprendimiento propio con talleres de costura y diseño.',
      duracion: '3 años',
      imagen: '/carreras/costura/foto_01.jpeg',
      galeria: JSON.stringify([
        '/carreras/costura/foto_01.jpeg',
        '/carreras/costura/foto_02.jpeg',
        '/carreras/costura/foto_03.jpeg',
        '/carreras/costura/foto_04.jpeg',
        '/carreras/costura/foto_05.jpeg',
        '/carreras/costura/foto_06.jpeg',
      ]),
    },
    {
      nombre: 'Bachillerato Industrial y Perito en Electricidad',
      slug: 'electricidad',
      descripcion: 'Esta carrera prepara a los estudiantes en la instalación, mantenimiento y reparación de sistemas eléctricos residenciales, comerciales e industriales. A lo largo de la formación adquieren conocimientos sobre circuitos eléctricos, instalaciones, normas de seguridad, uso de herramientas y equipos especializados, permitiéndoles resolver problemas técnicos de manera eficiente y segura.',
      objetivo: 'Formar técnicos electricistas competentes en la instalación, mantenimiento y reparación de sistemas eléctricos residenciales, comerciales e industriales, con sólidos conocimientos en seguridad eléctrica y normativa vigente.',
      perfilEgresado: 'El egresado será capaz de: diseñar e instalar sistemas eléctricos residenciales y comerciales; realizar mantenimiento preventivo y correctivo; interpretar planos eléctricos; aplicar normas de seguridad eléctrica; operar equipos de medición y prueba; y diagnosticar fallas en sistemas eléctricos.',
      campoLaboral: 'Empresas eléctricas, constructoras, fábricas e industrias, mantenimiento de edificios, empresas de servicio eléctrico, así como emprendimiento independiente en instalaciones eléctricas.',
      duracion: '3 años',
      imagen: '/carreras/electricidad/foto_01.jpeg',
      galeria: JSON.stringify([
        '/carreras/electricidad/foto_01.jpeg',
      ]),
    },
    {
      nombre: 'Bachillerato Industrial y Perito en Mecánica Automotriz',
      slug: 'mecanica-automotriz',
      descripcion: 'Esta carrera está enfocada en la formación de técnicos capaces de diagnosticar, reparar y dar mantenimiento a vehículos automotores. Los estudiantes desarrollan conocimientos sobre motores, sistemas de transmisión, frenos, suspensión, dirección, sistemas eléctricos y electrónicos del automóvil, utilizando herramientas y equipos especializados para brindar soluciones eficientes y de calidad.',
      objetivo: 'Formar técnicos mecánicos automotrices competentes en el diagnóstico, mantenimiento y reparación de vehículos automotores, con dominio de sistemas mecánicos, eléctricos y electrónicos del automóvil moderno.',
      perfilEgresado: 'El egresado será capaz de: diagnosticar fallas en vehículos automotores; realizar mantenimiento preventivo y correctivo de motores; reparar sistemas de transmisión, frenos, suspensión y dirección; manipular sistemas eléctricos y electrónicos del automóvil; utilizar equipos de diagnóstico computarizado; y gestionar talleres automotrices.',
      campoLaboral: 'Talleres automotrices, concesionarias de vehículos, empresas de transporte, flotillas empresariales, centros de servicio técnico, así como emprendimiento propio con taller mecánico.',
      duracion: '3 años',
      imagen: '/carreras/mecanica/foto_01.jpeg',
      galeria: JSON.stringify([
        '/carreras/mecanica/foto_01.jpeg',
        '/carreras/mecanica/foto_02.jpeg',
      ]),
    },
  ]

  const carreraRecords = {}
  for (const c of carreras) {
    carreraRecords[c.slug] = await prisma.carrera.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    })
    console.log(`  ✓ ${c.nombre}`)
  }

  // ===============================================
  // 3. CURSOS POR CARRERA Y AÑO
  // ===============================================
  console.log('📚 Creando cursos...')

  // Pensum de Computación (Datos del documento)
  const pensumComputacion = {
    4: [
      { area: 'Análisis de Sistemas', periodos: 10 },
      { area: 'Teoría de la Información', periodos: 5 },
      { area: 'Estadística', periodos: 2 },
      { area: 'Contabilidad Integral', periodos: 5 },
      { area: 'Física', periodos: 5 },
      { area: 'Tecnológica I (Programación Lenguaje Básico)', periodos: 5 },
      { area: 'Dibujo Técnico I', periodos: 4 },
      { area: 'Idioma extranjero I', periodos: 2 },
      { area: 'Matemática Técnica I', periodos: 3 },
      { area: 'Ciencias Naturales I', periodos: 2 },
      { area: 'Introducción Cívica I', periodos: 2 },
      { area: 'Educación Física I', periodos: 2 },
    ],
    5: [
      { area: 'Análisis de Sistemas', periodos: 12 },
      { area: 'Contabilidad general', periodos: 5 },
      { area: 'Fundamento de electrónica', periodos: 5 },
      { area: 'Algebra Lineal', periodos: 5 },
      { area: 'Tecnología II (Programación lenguaje cobol)', periodos: 5 },
      { area: 'Dibujo Técnico II', periodos: 4 },
      { area: 'Idioma Extranjero II', periodos: 2 },
      { area: 'Matemática Técnica II', periodos: 3 },
      { area: 'Ciencias Naturales II', periodos: 2 },
      { area: 'Relaciones industriales', periodos: 2 },
      { area: 'Educación Física II', periodos: 2 },
    ],
    6: [
      { area: 'Redes de Información', periodos: 5 },
      { area: 'Estructura de datos', periodos: 5 },
      { area: 'Arquitectura del computador', periodos: 3 },
      { area: 'Programación estructurada', periodos: 4 },
      { area: 'Fundamento de electrónica', periodos: 5 },
      { area: 'Matemática Técnica', periodos: 5 },
      { area: 'Tecnología III (Programación lenguaje pascal y fortran)', periodos: 5 },
      { area: 'Dibujo Técnico III', periodos: 4 },
      { area: 'Idioma extranjero III', periodos: 2 },
      { area: 'Organización de empresas', periodos: 3 },
      { area: 'Economía Política', periodos: 3 },
      { area: 'Relaciones públicas y laborales', periodos: 2 },
      { area: 'Higiene y primero auxilios', periodos: 3 },
      { area: 'Seminario sobre ciudadanía', periodos: 2 },
      { area: 'Práctica supervisada 250 horas', periodos: 2 },
    ],
  }

  // Pensum de Dibujo de Construcción (compartido con Costura, Electricidad, Mecánica)
  const pensumDibujoConstruccion = {
    4: [
      { area: 'Matemáticas', subarea: 'Matemáticas', periodos: 5 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje L-1', periodos: 4 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje -inglés-', periodos: 2 },
      { area: 'Comunicación y lenguaje', subarea: 'Tecnología de la información y la comunicación', periodos: 2 },
      { area: 'Ciencias sociales y formación ciudadana', subarea: 'Ciencias sociales y formación ciudadana', periodos: 3 },
      { area: 'Ciencias Naturales', subarea: 'Física', periodos: 4 },
      { area: 'Filosofía', subarea: 'Filosofía', periodos: 2 },
      { area: 'Tecnología', subarea: 'Dibujo Técnico', periodos: 3 },
      { area: 'Tecnología', subarea: 'Tecnología vocacional', periodos: 5 },
      { area: 'Tecnología', subarea: 'Práctica taller', periodos: 20 },
    ],
    5: [
      { area: 'Matemáticas', subarea: 'Matemáticas', periodos: 5 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje L-1', periodos: 5 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje -inglés-', periodos: 2 },
      { area: 'Comunicación y lenguaje', subarea: 'Tecnología de la información y la comunicación', periodos: 3 },
      { area: 'Ciencias Naturales', subarea: 'Química', periodos: 3 },
      { area: 'Expresión Artística', subarea: 'Expresión artística', periodos: 2 },
      { area: 'Psicología', subarea: 'Psicología industrial', periodos: 3 },
      { area: 'Filosofía', subarea: 'Ética profesional y relaciones humana', periodos: 2 },
      { area: 'Tecnología', subarea: 'Tecnología vocacional', periodos: 5 },
      { area: 'Tecnología', subarea: 'Práctica taller', periodos: 20 },
    ],
    6: [
      { area: 'Matemáticas', subarea: 'Matemáticas', periodos: 5 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje L-1', periodos: 5 },
      { area: 'Comunicación y lenguaje', subarea: 'Comunicación y lenguaje -inglés-', periodos: 3 },
      { area: 'Ciencias Naturales', subarea: 'Biología', periodos: 4 },
      { area: 'Educación Física', subarea: 'Educación Física', periodos: 2 },
      { area: 'Investigación', subarea: 'Seminario', periodos: 3 },
      { area: 'Tecnología', subarea: 'Tecnología vocacional', periodos: 5 },
      { area: 'Tecnología', subarea: 'Práctica taller', periodos: 20 },
      { area: 'Tecnología', subarea: 'Organización y administración de talleres', periodos: 3 },
      { area: 'Practica supervisada 250 horas', subarea: 'Práctica supervisada 250 horas', periodos: 250 },
    ],
  }

  // Crear cursos para Computación
  for (const anio of [4, 5, 6]) {
    await prisma.curso.upsert({
      where: { id: `curso-computacion-${anio}` },
      update: {},
      create: {
        id: `curso-computacion-${anio}`,
        nombre: `Computación - ${anio}° año`,
        carreraId: carreraRecords['computacion'].id,
        anio,
        descripcion: `Cursos correspondientes al ${anio}° año de la carrera de Computación`,
        pensum: JSON.stringify(pensumComputacion[anio]),
      },
    })
  }

  // Crear cursos para Dibujo de Construcción
  for (const anio of [4, 5, 6]) {
    await prisma.curso.upsert({
      where: { id: `curso-dibujo-${anio}` },
      update: {},
      create: {
        id: `curso-dibujo-${anio}`,
        nombre: `Dibujo de Construcción - ${anio}° año`,
        carreraId: carreraRecords['dibujo-construccion'].id,
        anio,
        descripcion: `Cursos correspondientes al ${anio}° año de la carrera de Dibujo de Construcción`,
        pensum: JSON.stringify(pensumDibujoConstruccion[anio]),
      },
    })
  }

  // Crear cursos para Costura Industrial (mismo pensum que Dibujo)
  for (const anio of [4, 5, 6]) {
    await prisma.curso.upsert({
      where: { id: `curso-costura-${anio}` },
      update: {},
      create: {
        id: `curso-costura-${anio}`,
        nombre: `Costura Industrial - ${anio}° año`,
        carreraId: carreraRecords['costura-industrial'].id,
        anio,
        descripcion: `Cursos correspondientes al ${anio}° año de la carrera de Costura Industrial`,
        pensum: JSON.stringify(pensumDibujoConstruccion[anio]),
      },
    })
  }

  // Crear cursos para Electricidad (mismo pensum que Dibujo)
  for (const anio of [4, 5, 6]) {
    await prisma.curso.upsert({
      where: { id: `curso-electricidad-${anio}` },
      update: {},
      create: {
        id: `curso-electricidad-${anio}`,
        nombre: `Electricidad - ${anio}° año`,
        carreraId: carreraRecords['electricidad'].id,
        anio,
        descripcion: `Cursos correspondientes al ${anio}° año de la carrera de Electricidad`,
        pensum: JSON.stringify(pensumDibujoConstruccion[anio]),
      },
    })
  }

  // Crear cursos para Mecánica Automotriz (mismo pensum que Dibujo)
  for (const anio of [4, 5, 6]) {
    await prisma.curso.upsert({
      where: { id: `curso-mecanica-${anio}` },
      update: {},
      create: {
        id: `curso-mecanica-${anio}`,
        nombre: `Mecánica Automotriz - ${anio}° año`,
        carreraId: carreraRecords['mecanica-automotriz'].id,
        anio,
        descripcion: `Cursos correspondientes al ${anio}° año de la carrera de Mecánica Automotriz`,
        pensum: JSON.stringify(pensumDibujoConstruccion[anio]),
      },
    })
  }
  console.log('✓ 15 cursos creados (5 carreras × 3 años)')

  // ===============================================
  // 4. USUARIOS DEMO
  // ===============================================
  console.log('👤 Creando usuarios demo...')

  // 4.1 Administrador
  const adminPass = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@iti.edu.gt' },
    update: {},
    create: {
      email: 'admin@iti.edu.gt',
      name: 'Administrador del Sistema',
      password: adminPass,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVO,
      codigo: 'ADMIN-001',
      telefono: '7760-2670',
      direccion: '7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos',
      foto: '/institucional/logo.jpeg',
    },
  })
  console.log(`  ✓ Admin: admin@iti.edu.gt / admin123`)

  // 4.2 Docente demo
  const docentePass = await bcrypt.hash('docente123', 10)
  const docenteUser = await prisma.user.upsert({
    where: { email: 'docente@iti.edu.gt' },
    update: {},
    create: {
      email: 'docente@iti.edu.gt',
      name: 'Prof. Carlos Hernández',
      password: docentePass,
      role: UserRole.DOCENTE,
      status: UserStatus.ACTIVO,
      codigo: 'DOC-001',
      telefono: '7760-1111',
    },
  })

  const docente = await prisma.docente.upsert({
    where: { userId: docenteUser.id },
    update: {},
    create: {
      userId: docenteUser.id,
      especialidad: 'Programación y Análisis de Sistemas',
      tituloProfesional: 'Ingeniero en Sistemas',
      fechaIngreso: new Date('2020-01-15'),
    },
  })

  // Asignar cursos al docente
  for (const anio of [4, 5, 6]) {
    await prisma.cursoAsignado.upsert({
      where: { id: `asig-computacion-${anio}` },
      update: {},
      create: {
        id: `asig-computacion-${anio}`,
        cursoId: `curso-computacion-${anio}`,
        docenteId: docente.id,
        anio: 2025,
      },
    })
  }
  console.log(`  ✓ Docente: docente@iti.edu.gt / docente123`)

  // 4.3 Estudiante demo
  const estudiantePass = await bcrypt.hash('estudiante123', 10)
  const estudianteUser = await prisma.user.upsert({
    where: { email: 'estudiante@iti.edu.gt' },
    update: {},
    create: {
      email: 'estudiante@iti.edu.gt',
      name: 'María José Pérez López',
      password: estudiantePass,
      role: UserRole.ESTUDIANTE,
      status: UserStatus.ACTIVO,
      codigo: 'EST-2024-001',
      telefono: '7760-2222',
      carreraId: carreraRecords['computacion'].id,
      fechaNacimiento: new Date('2007-05-12'),
    },
  })

  const estudiante = await prisma.estudiante.upsert({
    where: { userId: estudianteUser.id },
    update: {},
    create: {
      userId: estudianteUser.id,
      padreNombre: 'Sr. Juan Pérez',
      padreTelefono: '7760-3333',
      padreEmail: 'juan.perez@gmail.com',
      fechaInscripcion: new Date('2024-01-15'),
      anio: 5,
      seccion: 'A',
    },
  })

  // Inscribir al estudiante en cursos de 5to año
  for (const cursoId of [`curso-computacion-5`, `curso-dibujo-5`, `curso-costura-5`]) {
    await prisma.inscripcion.upsert({
      where: { id: `insc-${estudiante.id}-${cursoId}` },
      update: {},
      create: {
        id: `insc-${estudiante.id}-${cursoId}`,
        estudianteId: estudiante.id,
        cursoId,
        anio: 2025,
      },
    })
  }

  // Crear horarios para el estudiante
  const dias = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
  const horarios = [
    { cursoId: 'curso-computacion-5', horaInicio: '14:00', horaFin: '15:30' },
    { cursoId: 'curso-dibujo-5', horaInicio: '15:30', horaFin: '17:00' },
    { cursoId: 'curso-costura-5', horaInicio: '17:00', horaFin: '18:30' },
  ]

  for (let d = 0; d < 3; d++) {
    for (const h of horarios) {
      const horario = await prisma.horario.create({
        data: {
          cursoId: h.cursoId,
          dia: dias[d],
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
          aula: `Aula ${d + 1}`,
        },
      })
      await prisma.horarioEstudiante.create({
        data: { horarioId: horario.id, estudianteId: estudiante.id },
      })
    }
  }

  // Crear calificaciones demo
  const cursosEstudiante = ['curso-computacion-5', 'curso-dibujo-5', 'curso-costura-5']
  for (const cursoId of cursosEstudiante) {
    for (const unidad of [1, 2, 3, 4]) {
      await prisma.calificacion.create({
        data: {
          estudianteId: estudiante.id,
          cursoId,
          unidad,
          nota: 70 + Math.floor(Math.random() * 25),
          publicada: true,
          observaciones: `Calificación unidad ${unidad}`,
        },
      })
    }
  }

  // Crear tarea demo
  const tareaDemo = await prisma.tarea.create({
    data: {
      titulo: 'Proyecto Final - Programación en BASIC',
      descripcion: `Desarrollar un programa en lenguaje BASIC que permita gestionar un inventario de productos.

Requisitos:
1. Menú principal con opciones (Agregar, Eliminar, Buscar, Listar, Salir)
2. Almacenamiento en archivos
3. Búsqueda por código y nombre
4. Reporte de productos con stock bajo

Fecha de entrega: Viernes 25 de julio
Punteo máximo: 100 puntos

Entregar:
- Código fuente (.bas)
- Manual de usuario (PDF)
- Programa ejecutable`,
      cursoId: 'curso-computacion-5',
      docenteId: docente.id,
      fechaEntrega: new Date('2025-07-25'),
      punteoMaximo: 100,
    },
  })

  // Crear otra tarea
  await prisma.tarea.create({
    data: {
      titulo: 'Ejercicio de Algoritmos',
      descripcion: 'Resolver los 5 ejercicios del capítulo 3 del libro de algoritmos. Documentar el proceso.',
      cursoId: 'curso-computacion-5',
      docenteId: docente.id,
      fechaEntrega: new Date('2025-07-22'),
      punteoMaximo: 50,
    },
  })

  console.log(`  ✓ Estudiante: estudiante@iti.edu.gt / estudiante123`)

  // 4.4 Preinscripción pendiente demo
  await prisma.preinscripcion.create({
    data: {
      padreNombre: 'Sra. Ana García',
      padreTelefono: '7760-4444',
      padreEmail: 'ana.garcia@gmail.com',
      estudianteNombre: 'Luis Fernando García',
      estudianteCodigo: 'EST-2025-PRE-001',
      estudianteTelefono: '7760-5555',
      estudianteEmail: 'luis.garcia@gmail.com',
      carreraId: carreraRecords['mecanica-automotriz'].id,
      carreraNombre: 'Bachillerato Industrial y Perito en Mecánica Automotriz',
      status: PreinscripcionStatus.PENDIENTE,
    },
  }).catch(() => {})

  // 4.5 Solicitud de docente pendiente
  await prisma.user.create({
    data: {
      email: 'nuevo.docente@iti.edu.gt',
      name: 'Prof. Laura Martínez',
      role: UserRole.DOCENTE,
      status: UserStatus.PENDIENTE,
      codigo: 'DOC-002-PEND',
      telefono: '7760-6666',
    },
  }).catch(() => {})

  console.log('  ✓ Preinscripción y solicitud de docente pendientes creadas')

  // ===============================================
  // 5. NOTICIAS Y EVENTOS
  // ===============================================
  console.log('📰 Creando noticias y eventos...')

  const noticias = [
    {
      titulo: 'Inicio del Ciclo Escolar 2025',
      resumen: 'Damos la bienvenida a todos los estudiantes al nuevo ciclo escolar 2025 del Instituto Técnico Industrial.',
      contenido: 'Con gran entusiasmo iniciamos el ciclo escolar 2025 en el Instituto Técnico Industrial. Este año contamos con una matrícula de más de 500 estudiantes distribuidos en las 5 carreras técnicas que ofrecemos.\n\nNuestro compromiso con la excelencia académica nos motiva a continuar mejorando nuestros procesos de enseñanza-aprendizaje, incorporando nuevas tecnologías y metodologías pedagógicas que beneficien el desarrollo integral de nuestros estudiantes.\n\nLes deseamos mucho éxito en este nuevo ciclo y los invitamos a aprovechar al máximo todas las oportunidades académicas y formativas que ofrece el instituto.',
      imagen: '/instalaciones/foto_01.jpeg',
      destacada: true,
    },
    {
      titulo: 'Inscripciones Abiertas para Nuevos Estudiantes',
      resumen: 'Abierto el periodo de preinscripción para el ciclo 2026. ¡Asegura tu lugar!',
      contenido: 'El Instituto Técnico Industrial abre sus puertas a nuevos estudiantes para el ciclo 2026. Las carreras disponibles son:\n\n- Bachillerato Industrial y Perito en Computación\n- Bachillerato Industrial y Perito en Dibujo de Construcción\n- Bachillerato Industrial y Perito en Costura Industrial\n- Bachillerato Industrial y Perito en Electricidad\n- Bachillerato Industrial y Perito en Mecánica Automotriz\n\nTodas nuestras carreras tienen una duración de 3 años y los egresados obtienen dos títulos: Bachiller Industrial y Perito en la especialidad.\n\nLos interesados pueden realizar su preinscripción a través del formulario en línea disponible en esta página web. Para más información, visitar nuestras instalaciones o llamar al 7760-2670.',
      imagen: '/instalaciones/foto_02.jpeg',
      destacada: true,
    },
    {
      titulo: 'Capacitación Docente en Nuevas Tecnologías',
      resumen: 'Docentes del instituto participan en programa de actualización tecnológica.',
      contenido: 'Como parte de nuestro compromiso con la mejora continua, los docentes del Instituto Técnico Industrial participan en un programa de capacitación en nuevas tecnologías educativas.\n\nEl programa incluye formación en herramientas digitales, metodologías activas, evaluación por competencias y uso de plataformas educativas. Esto permite a nuestros docentes estar actualizados y ofrecer una educación de calidad alineada con las demandas del mundo actual.',
      imagen: '/instalaciones/foto_03.jpeg',
    },
    {
      titulo: 'Convenio con Empresas del Sector Industrial',
      resumen: 'Estudiantes de 6to año podrán realizar prácticas profesionales en empresas aliadas.',
      contenido: 'Nos complace anunciar la firma de convenios con importantes empresas del sector industrial de la región, lo que permitirá a nuestros estudiantes de 6to año realizar sus prácticas supervisadas en entornos laborales reales.\n\nEstos convenios fortalecen nuestra propuesta educativa y brindan a los estudiantes la oportunidad de aplicar sus conocimientos en situaciones prácticas, desarrollar habilidades profesionales y establecer contactos en el ámbito laboral.\n\nLas empresas participantes cubren los sectores de tecnología, electricidad, mecánica automotriz, construcción y textil, beneficiando a estudiantes de todas nuestras carreras.',
      imagen: '/instalaciones/foto_04.jpeg',
    },
  ]

  for (const n of noticias) {
    await prisma.noticia.create({ data: n })
  }
  console.log(`  ✓ ${noticias.length} noticias creadas`)

  // Eventos
  const eventos = [
    {
      titulo: 'Asamblea General de Estudiantes',
      descripcion: 'Asamblea informativa sobre el cronograma del segundo semestre.',
      fecha: new Date('2025-08-15'),
      hora: '15:00',
      lugar: 'Auditorio del Instituto',
    },
    {
      titulo: 'Feria de Ciencias y Tecnología',
      descripcion: 'Muestra de proyectos tecnológicos y científicos desarrollados por los estudiantes.',
      fecha: new Date('2025-09-20'),
      hora: '09:00',
      lugar: 'Patios del Instituto',
    },
    {
      titulo: 'Graduación Promoción 2025',
      descripcion: 'Acto de graduación de los estudiantes de 6to año.',
      fecha: new Date('2025-11-28'),
      hora: '18:00',
      lugar: 'Teatro Municipal de San Pedro Sacatepéquez',
    },
    {
      titulo: 'Inscripciones Presenciales 2026',
      descripcion: 'Periodo de inscripción presencial para nuevos estudiantes.',
      fecha: new Date('2025-12-01'),
      hora: '08:00',
      lugar: 'Oficina de Registro - Instituto Técnico Industrial',
    },
  ]
  for (const e of eventos) {
    await prisma.evento.create({ data: e })
  }
  console.log(`  ✓ ${eventos.length} eventos creados`)

  // ===============================================
  // 6. GALERÍA Y FAQ
  // ===============================================
  console.log('🖼️ Creando galería...')

  const galeria = [
    { titulo: 'Entrada principal del instituto', url: '/instalaciones/foto_01.jpeg', categoria: 'instalaciones' },
    { titulo: 'Aulas de clases', url: '/instalaciones/foto_02.jpeg', categoria: 'aulas' },
    { titulo: 'Laboratorio de cómputo', url: '/carreras/computacion/foto_02.jpeg', categoria: 'laboratorios' },
    { titulo: 'Taller de costura', url: '/carreras/costura/foto_01.jpeg', categoria: 'talleres' },
    { titulo: 'Taller de dibujo', url: '/carreras/dibujo/foto_01.jpeg', categoria: 'talleres' },
    { titulo: 'Taller de electricidad', url: '/carreras/electricidad/foto_01.jpeg', categoria: 'talleres' },
    { titulo: 'Estudiantes en clase', url: '/carreras/computacion/foto_03.jpeg', categoria: 'actividades' },
    { titulo: 'Práctica de computación', url: '/carreras/computacion/foto_04.jpeg', categoria: 'actividades' },
    { titulo: 'Trabajo en taller', url: '/carreras/dibujo/foto_02.jpeg', categoria: 'actividades' },
    { titulo: 'Patios del instituto', url: '/instalaciones/foto_03.jpeg', categoria: 'instalaciones' },
  ]
  for (const g of galeria) {
    await prisma.fotoGaleria.create({ data: g })
  }

  // FAQ
  const faqs = [
    { pregunta: '¿Cuánto dura cada carrera?', respuesta: 'Todas nuestras carreras técnicas tienen una duración de 3 años. Al finalizar, el estudiante obtiene dos títulos: Bachiller Industrial y Perito en la especialidad seleccionada.', orden: 1 },
    { pregunta: '¿Qué requisitos necesito para inscribirme?', respuesta: 'Los requisitos son: ser egresado de educación básica, presentar certificado de estudios, diploma de graduación, fotocopia de cédula, certificado de nacimiento, certificado de salud y 2 fotografías tamaño cédula. El proceso inicia con la preinscripción en línea en esta página.', orden: 2 },
    { pregunta: '¿Cuál es el costo de la matrícula?', respuesta: 'El Instituto Técnico Industrial pertenece al sector oficial, por lo que la educación es gratuita. Solo se cancelan cuotas voluntarias a la organización de padres de familia (OPF) para gastos operativos.', orden: 3 },
    { pregunta: '¿Qué horarios manejan?', respuesta: 'Funcionamos en jornada vespertina, de 14:00 a 18:30 horas, de lunes a viernes. Algunas prácticas especializadas pueden tener horarios extendidos.', orden: 4 },
    { pregunta: '¿Puedo continuar estudios universitarios al graduarme?', respuesta: 'Sí, nuestros egresados obtienen el título de Bachiller Industrial, lo que les permite ingresar a cualquier universidad del país. La formación técnica también les otorga ventajas en carreras afines a su especialidad.', orden: 5 },
    { pregunta: '¿Ofrecen becas?', respuesta: 'El Ministerio de Educación ofrece programas de becas escolares para aprender inglés, bolsas de estudio y actualmente se cuenta con cobertura de los programas de Alimentación Escolar y Útiles Escolares. Los programas son manejados por las organizaciones de padres de familia (OPF).', orden: 6 },
    { pregunta: '¿Dónde están ubicados?', respuesta: 'Estamos ubicados en la 7A. Avenida 6-07, zona 2 del municipio de San Pedro Sacatepéquez, San Marcos. Compartimos instalaciones con el Instituto Nacional Experimental jornada vespertina.', orden: 7 },
    { pregunta: '¿Cómo contacto al instituto?', respuesta: 'Puede comunicarse al teléfono 7760-2670 o al correo electrónico tecnicoindustrial@gmail.com. También puede visitar nuestras instalaciones en horario de oficina.', orden: 8 },
  ]
  for (const f of faqs) {
    await prisma.faq.create({ data: f })
  }

  // Comentarios de visitantes
  const comentarios = [
    { nombre: 'Roberto Mendoza', email: 'roberto.m@gmail.com', comentario: 'Excelente instituto, mi hijo se graduó de Computación y ahora trabaja en una empresa de software. Muy agradecidos por la formación recibida.', calificacion: 5, aprobado: true },
    { nombre: 'Carmen Ruiz', email: 'carmen.ruiz@gmail.com', comentario: 'Las instalaciones están muy bien equipadas y los docentes son muy profesionales. Recomiendo este instituto al 100%.', calificacion: 5, aprobado: true },
    { nombre: 'José Antonio Pérez', email: 'jose.perez@gmail.com', comentario: 'La carrera de Mecánica Automotriz es muy completa. Los talleres tienen todo lo necesario para aprender.', calificacion: 5, aprobado: true },
    { nombre: 'María Fernanda López', email: 'mafe.lopez@gmail.com', comentario: 'Mi hija estudia Costura Industrial y está muy contenta. Los profesores la han ayudado mucho a desarrollar sus habilidades.', calificacion: 4, aprobado: true },
  ]
  for (const c of comentarios) {
    await prisma.comentarioVisitante.create({ data: c })
  }

  // ===============================================
  // 7. BIBLIOTECA
  // ===============================================
  console.log('📖 Creando libros demo...')

  const libros = [
    {
      titulo: 'Fundamentos de Programación en BASIC',
      autor: 'Prof. Carlos Hernández',
      descripcion: 'Manual completo para aprender programación estructurada en lenguaje BASIC, desde conceptos básicos hasta aplicaciones avanzadas.',
      categoria: LibroCategoria.COMPUTACION,
      archivoUrl: '#',
      paginas: 245,
      publicadoPor: admin.id,
      docenteId: docente.id,
    },
    {
      titulo: 'Redes de Computadoras - Teoría y Práctica',
      autor: 'Ing. Roberto Méndez',
      descripcion: 'Guía completa sobre redes de computadoras: protocolos, topologías, administración y seguridad.',
      categoria: LibroCategoria.COMPUTACION,
      archivoUrl: '#',
      paginas: 320,
      publicadoPor: admin.id,
    },
    {
      titulo: 'Análisis de Sistemas Informáticos',
      autor: 'Prof. Carlos Hernández',
      descripcion: 'Metodologías y herramientas para el análisis y diseño de sistemas de información.',
      categoria: LibroCategoria.COMPUTACION,
      archivoUrl: '#',
      paginas: 180,
      publicadoPor: admin.id,
      docenteId: docente.id,
    },
    {
      titulo: 'Dibujo Técnico Arquitectónico',
      autor: 'Arq. Sandra López',
      descripcion: 'Principios del dibujo arquitectónico, normas técnicas y uso de software CAD.',
      categoria: LibroCategoria.DIBUJO,
      archivoUrl: '#',
      paginas: 280,
      publicadoPor: admin.id,
    },
    {
      titulo: 'Instalaciones Eléctricas Residenciales',
      autor: 'Ing. Francisco Mendoza',
      descripcion: 'Manual teórico-práctico sobre diseño e instalación de sistemas eléctricos residenciales.',
      categoria: LibroCategoria.ELECTRICIDAD,
      archivoUrl: '#',
      paginas: 195,
      publicadoPor: admin.id,
    },
    {
      titulo: 'Costura Industrial - Técnicas y Patronaje',
      autor: 'Lic. Patricia Ramírez',
      descripcion: 'Guía completa de técnicas de costura industrial, patronaje y confección de prendas.',
      categoria: LibroCategoria.COSTURA,
      archivoUrl: '#',
      paginas: 220,
      publicadoPor: admin.id,
    },
    {
      titulo: 'Mecánica Automotriz Moderna',
      autor: 'Ing. Manuel Velásquez',
      descripcion: 'Diagnóstico y reparación de sistemas automotrices modernos, incluyendo sistemas electrónicos.',
      categoria: LibroCategoria.MECANICA,
      archivoUrl: '#',
      paginas: 410,
      publicadoPor: admin.id,
    },
    {
      titulo: 'Matemáticas Técnicas - Nivel I',
      autor: 'Lic. Ana Torres',
      descripcion: 'Texto de matemáticas aplicadas a carreras técnicas: álgebra, trigonometría y geometría analítica.',
      categoria: LibroCategoria.ACADEMICA,
      archivoUrl: '#',
      paginas: 350,
      publicadoPor: admin.id,
    },
  ]
  for (const l of libros) {
    await prisma.libro.create({ data: l })
  }
  console.log(`  ✓ ${libros.length} libros creados`)

  // ===============================================
  // 8. NOTIFICACIONES INICIALES
  // ===============================================
  console.log('🔔 Creando notificaciones...')

  // Notificación global
  const notif = await prisma.notificacion.create({
    data: {
      titulo: 'Bienvenidos al ciclo 2025',
      mensaje: 'Damos la bienvenida a todos los estudiantes, docentes y personal al nuevo ciclo escolar 2025. ¡Muchos éxitos!',
      tipo: NotificacionTipo.GENERAL,
      esGlobal: true,
      publicadoPor: admin.id,
    },
  })

  // Notificación individual para estudiante
  await prisma.notificacionUsuario.create({
    data: {
      notificacionId: notif.id,
      userId: estudianteUser.id,
    },
  })

  await prisma.notificacion.create({
    data: {
      titulo: 'Nueva tarea asignada',
      mensaje: 'Se ha asignado la tarea "Proyecto Final - Programación en BASIC". Fecha de entrega: 25 de julio.',
      tipo: NotificacionTipo.TAREA,
      publicadoPor: docenteUser.id,
      destinatarios: {
        create: { userId: estudianteUser.id },
      },
    },
  })

  console.log('✓ Notificaciones creadas')

  console.log('\n✅ Seed completado exitosamente!')
  console.log('\n📋 USUARIOS DEMO:')
  console.log('  Admin:      admin@iti.edu.gt / admin123')
  console.log('  Docente:    docente@iti.edu.gt / docente123')
  console.log('  Estudiante: estudiante@iti.edu.gt / estudiante123')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
