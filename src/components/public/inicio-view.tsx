'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useRouterStore } from '@/lib/store'
import { 
  History, Eye, Target, Users, Phone, Mail, MapPin, Clock, 
  Calendar, Star, ChevronRight, GraduationCap, Award, BookOpen,
  Building2, ArrowRight, FileText, User, CheckCircle2, AlertCircle, Loader2, ListChecks
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CARRERAS_RAPIDAS = [
  { nombre: 'Computación', slug: 'computacion', foto: '/carreras/computacion/foto_01.jpeg' },
  { nombre: 'Dibujo de Construcción', slug: 'dibujo-construccion', foto: '/carreras/dibujo/foto_01.jpeg' },
  { nombre: 'Costura Industrial', slug: 'costura-industrial', foto: '/carreras/costura/foto_01.jpeg' },
  { nombre: 'Electricidad', slug: 'electricidad', foto: '/carreras/electricidad/foto_01.jpeg' },
  { nombre: 'Mecánica Automotriz', slug: 'mecanica-automotriz', foto: '/carreras/mecanica/foto_01.jpeg' },
]

export function InicioView() {
  const { setPath } = useRouterStore()
  const { toast } = useToast()
  const [noticias, setNoticias] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [galeria, setGaleria] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [comentarios, setComentarios] = useState<any[]>([])
  const [carreras, setCarreras] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Form comentario
  const [comentarioForm, setComentarioForm] = useState({ nombre: '', email: '', comentario: '', calificacion: 5 })

  // Form preinscripción embebido
  const [preForm, setPreForm] = useState({
    padreNombre: '', padreTelefono: '', padreEmail: '',
    estudianteNombre: '', estudianteCodigo: '', estudianteTelefono: '', estudianteEmail: '',
    carreraId: '',
  })
  const [preLoading, setPreLoading] = useState(false)
  const [preSuccess, setPreSuccess] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/noticias').then(r => r.json()),
      fetch('/api/eventos').then(r => r.json()),
      fetch('/api/galeria').then(r => r.json()),
      fetch('/api/faq').then(r => r.json()),
      fetch('/api/comentarios-visitantes').then(r => r.json()),
      fetch('/api/carreras').then(r => r.json()),
    ]).then(([n, e, g, f, c, ca]) => {
      setNoticias(n.noticias || [])
      setEventos(e.eventos || [])
      setGaleria(g.fotos || [])
      setFaqs(f.faqs || [])
      setComentarios(c.comentarios || [])
      setCarreras(ca.carreras || [])
      setLoading(false)
    })
  }, [])

  const enviarComentario = async () => {
    if (!comentarioForm.nombre || !comentarioForm.email || !comentarioForm.comentario) {
      toast({ title: 'Error', description: 'Complete todos los campos', variant: 'destructive' })
      return
    }
    const res = await fetch('/api/comentarios-visitantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comentarioForm),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Comentario enviado', description: data.message })
      setComentarioForm({ nombre: '', email: '', comentario: '', calificacion: 5 })
    } else {
      toast({ title: 'Error', description: data.error, variant: 'destructive' })
    }
  }

  const enviarPreinscripcion = async () => {
    const required = ['padreNombre', 'padreTelefono', 'padreEmail', 'estudianteNombre', 'estudianteCodigo', 'estudianteTelefono', 'estudianteEmail', 'carreraId']
    for (const f of required) {
      if (!preForm[f as keyof typeof preForm]) {
        toast({ title: 'Error', description: 'Complete todos los campos obligatorios', variant: 'destructive' })
        return
      }
    }
    if (!/^\S+@\S+\.\S+$/.test(preForm.padreEmail) || !/^\S+@\S+\.\S+$/.test(preForm.estudianteEmail)) {
      toast({ title: 'Error', description: 'Correos electrónicos inválidos', variant: 'destructive' })
      return
    }
    setPreLoading(true)
    try {
      const res = await fetch('/api/preinscripciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preForm),
      })
      const data = await res.json()
      if (data.ok) {
        setPreSuccess(data)
        toast({ title: 'Solicitud enviada', description: 'Se ha enviado un correo de confirmación.' })
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la solicitud', variant: 'destructive' })
    }
    setPreLoading(false)
  }

  return (
    <div className="animate-fadeIn">
      {/* ============================================== */}
      {/* BANNER PRINCIPAL - HERO con foto de instalaciones */}
      {/* ============================================== */}
      <section className="relative overflow-hidden h-[480px] md:h-[560px]">
        {/* Foto de fondo: instalaciones del instituto */}
        <div className="absolute inset-0">
          <img
            src="/fondo-instituto.jpeg"
            alt="Instalaciones del Instituto Técnico Industrial"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-white h-full flex items-center">
          <div className="max-w-3xl">
            <Badge className="bg-accent text-accent-foreground mb-4">
              Acuerdo Ministerial No. 1007 - 1989
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight drop-shadow-lg">
              Instituto Técnico Industrial
            </h1>
            <p className="text-lg md:text-xl mb-2 opacity-90 drop-shadow">
              Adscrito al INEB - Jornada Vespertina
            </p>
            <p className="text-xl md:text-2xl mb-6 font-light italic text-accent drop-shadow">
              "Solo la calidad nos hace competitivos"
            </p>
            <p className="text-base md:text-lg mb-8 opacity-90 max-w-2xl drop-shadow">
              Institución educativa de servicio público comprometida con la formación integral
              de jóvenes, ofreciendo carreras técnicas de alta demanda laboral en San Pedro Sacatepéquez, San Marcos.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById('preinscripcion-form')
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Preinscribirse ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setPath('/carreras')}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                Ver carreras
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Carreras con foto - tarjetas grandes */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Nuestras Carreras Técnicas</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Haz clic en la foto de la carrera de tu interés para conocer los detalles, cursos y más información.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CARRERAS_RAPIDAS.map((c) => (
            <button
              key={c.slug}
              onClick={() => setPath(`/carreras/${c.slug}`)}
              className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all hover:scale-[1.02] aspect-[3/4]"
            >
              <img
                src={c.foto}
                alt={c.nombre}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="font-semibold text-sm leading-tight text-center drop-shadow">{c.nombre}</div>
                <div className="mt-2 inline-flex items-center justify-center w-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded">Ver carrera →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================== */}
      {/* HISTORIA */}
      {/* ============================================== */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="h-6 w-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold">Breve Reseña Histórica</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  El Instituto Técnico Industrial, adscrito al Instituto Nacional Experimental
                  de Educación Básica con Orientación Ocupacional Jornada Vespertina de la ciudad
                  de San Pedro Sacatepéquez, San Marcos, es una Institución Educativa creada por
                  Acuerdo Ministerial No. 1007 del 30 de agosto del año 1989.
                </p>
                <p>
                  Surgió gracias a las gestiones de profesionales sampedranos; inicialmente como
                  respuesta a la necesidad de los estudiantes egresados del ciclo de educación
                  básica de los Institutos Experimentales, para que tuvieran la posibilidad de
                  darle seguimiento a los conocimientos técnicos adquiridos en las áreas
                  ocupacionales del ciclo básico.
                </p>
                <p>
                  Al principio se autorizaron las carreras de Bachillerato Industrial y Perito en
                  Costura Industrial (vigente) y Bachillerato Industrial y Perito en Carpintería
                  de Construcción (que dejó de funcionar), dando paso a la creación de la carrera
                  de Dibujo de Construcción. Posteriormente se implementaron Electricidad (hoy
                  Electricidad Industrial) y Mecánica Automotriz, y en 2014 fue implementada la
                  carrera de Computación.
                </p>
                <p className="font-medium text-foreground">
                  Actualmente funcionan 22 Institutos Técnicos Industriales en todo el país,
                  siendo el de San Pedro Sacatepéquez el único con estas características en
                  el departamento de San Marcos.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <img src="/instalaciones/foto_02.jpeg" alt="Instalación 1" className="rounded-lg shadow-md w-full h-48 object-cover" />
              <img src="/instalaciones/foto_03.jpeg" alt="Instalación 2" className="rounded-lg shadow-md w-full h-48 object-cover mt-6" />
              <img src="/instalaciones/foto_04.jpeg" alt="Instalación 3" className="rounded-lg shadow-md w-full h-48 object-cover" />
              <img src="/instalaciones/foto_05.jpeg" alt="Instalación 4" className="rounded-lg shadow-md w-full h-48 object-cover mt-6" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* MISIÓN, VISIÓN, QUIÉNES SOMOS */}
      {/* ============================================== */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="iti-card border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-primary">Misión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ser una Institución Educativa comprometida con la formación integral del
                estudiante, orientada al mundo de la tecnología y la comunicación digital,
                con un equipo de trabajo eficiente y eficaz que utilizan la creatividad, la
                ciencia y los valores, para formar personas exitosas y sólidas, para el mundo real.
              </p>
            </CardContent>
          </Card>

          <Card className="iti-card border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                <Eye className="h-6 w-6 text-accent-foreground" />
              </div>
              <CardTitle className="text-primary">Visión</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Somos una institución educativa de servicio público, que trabaja por una sólida
                formación académica, técnica y ocupacional inspirada en principios pedagógicos
                pragmáticos y la vivencia de valores morales, culturales y tecnológicos, que
                promueve una educación incluyente, innovadora y proactiva, que propicia el
                desarrollo de las capacidades, habilidades y destrezas, para la búsqueda de la
                eficiencia académica y la adecuada inserción en otros niveles educativos y
                ámbitos de la vida.
              </p>
            </CardContent>
          </Card>

          <Card className="iti-card border-primary/20">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-primary">¿Quiénes somos?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Somos el Instituto Técnico Industrial Adscrito al INEB, Jornada Vespertina,
                una institución educativa de servicio público comprometida con la formación
                integral de los jóvenes. Nos especializamos en brindar una educación académica,
                técnica y ocupacional de calidad, orientada al desarrollo de competencias
                tecnológicas, científicas y humanas.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nuestra labor se fundamenta en la innovación, la inclusión y la práctica de
                valores morales, culturales y tecnológicos.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================== */}
      {/* INFORMACIÓN INSTITUCIONAL */}
      {/* ============================================== */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">5</div>
              <div className="text-sm opacity-80">Carreras Técnicas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">3 años</div>
              <div className="text-sm opacity-80">Duración de carreras</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">2 títulos</div>
              <div className="text-sm opacity-80">Por carrera (Bachiller + Perito)</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-1">1989</div>
              <div className="text-sm opacity-80">Año de fundación</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* NOTICIAS Y EVENTOS */}
      {/* ============================================== */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Noticias */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Noticias Importantes
              </h2>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {noticias.map((n: any) => (
                <Card key={n.id} className="iti-card overflow-hidden">
                  {n.imagen && (
                    <img src={n.imagen} alt={n.titulo} className="w-full h-32 object-cover" />
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      {n.destacada && (
                        <Badge className="bg-accent text-accent-foreground text-[10px]">Destacada</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.fechaPublicacion).toLocaleDateString('es-GT', {
                          year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-base">{n.titulo}</CardTitle>
                    <CardDescription className="text-sm">{n.resumen}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Eventos */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" /> Próximos Eventos
              </h2>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {eventos.length === 0 ? (
                <p className="text-muted-foreground text-sm">No hay eventos próximos.</p>
              ) : (
                eventos.map((e: any) => (
                  <Card key={e.id} className="iti-card">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-lg flex flex-col items-center justify-center text-primary">
                          <div className="text-xl font-bold">
                            {new Date(e.fecha).getDate()}
                          </div>
                          <div className="text-[10px] uppercase">
                            {new Date(e.fecha).toLocaleDateString('es-GT', { month: 'short' })}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm">{e.titulo}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.descripcion}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{e.hora}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.lugar}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* GALERÍA */}
      {/* ============================================== */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> Galería de Fotografías
          </h2>
          <p className="text-muted-foreground mb-6 max-w-3xl">
            Conoce nuestras instalaciones, talleres y la vida estudiantil del Instituto Técnico Industrial.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {galeria.map((g: any) => (
              <button
                key={g.id}
                onClick={() => setSelectedImage(g.url)}
                className="iti-card overflow-hidden group relative aspect-square"
              >
                <img src={g.url} alt={g.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <p className="text-white text-xs font-medium">{g.titulo}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Modal de imagen */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={selectedImage} alt="Ampliada" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}

      {/* ============================================== */}
      {/* UBICACIÓN Y CONTACTO */}
      {/* ============================================== */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Información de Contacto</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 iti-card">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Dirección</div>
                  <div className="text-sm text-muted-foreground">
                    7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 iti-card">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Teléfono</div>
                  <a href="tel:7760-2670" className="text-sm text-muted-foreground hover:text-primary">7760-2670</a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 iti-card">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Correo electrónico</div>
                  <a href="mailto:tecnicoindustrial@gmail.com" className="text-sm text-muted-foreground hover:text-primary break-all">
                    tecnicoindustrial@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 iti-card">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <div className="font-semibold text-sm">Horario</div>
                  <div className="text-sm text-muted-foreground">
                    Jornada Vespertina: Lunes a Viernes, 14:00 - 18:30 horas
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4">Ubicación</h2>
            <div className="iti-card overflow-hidden h-[400px]">
              <iframe
                src="https://www.google.com/maps?q=San+Pedro+Sacatepequez+San+Marcos+Guatemala&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación del Instituto Técnico Industrial"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================== */}
      {/* FAQ */}
      {/* ============================================== */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Preguntas Frecuentes</h2>
          <Accordion type="single" collapsible>
            {faqs.map((f: any) => (
              <AccordionItem key={f.id} value={`faq-${f.id}`}>
                <AccordionTrigger className="text-left">{f.pregunta}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.respuesta}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ============================================== */}
      {/* COMENTARIOS DE VISITANTES */}
      {/* ============================================== */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Comentarios de Visitantes</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Listado */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {comentarios.length === 0 ? (
              <p className="text-muted-foreground text-center">Aún no hay comentarios aprobados.</p>
            ) : (
              comentarios.map((c: any) => (
                <Card key={c.id} className="iti-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{c.nombre.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-sm">{c.nombre}</div>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < c.calificacion ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{c.comentario}</p>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          {new Date(c.createdAt).toLocaleDateString('es-GT')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* Formulario */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deje su comentario</CardTitle>
              <CardDescription>Su comentario será visible una vez aprobado por el administrador.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="c-nombre">Nombre</Label>
                <Input
                  id="c-nombre"
                  value={comentarioForm.nombre}
                  onChange={(e) => setComentarioForm({ ...comentarioForm, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={comentarioForm.email}
                  onChange={(e) => setComentarioForm({ ...comentarioForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="c-cal">Calificación</Label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setComentarioForm({ ...comentarioForm, calificacion: i + 1 })}
                    >
                      <Star
                        className={`h-6 w-6 ${i < comentarioForm.calificacion ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="c-com">Comentario</Label>
                <Textarea
                  id="c-com"
                  rows={3}
                  value={comentarioForm.comentario}
                  onChange={(e) => setComentarioForm({ ...comentarioForm, comentario: e.target.value })}
                />
              </div>
              <Button onClick={enviarComentario} className="w-full bg-primary hover:bg-primary/90">
                Enviar comentario
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ============================================== */}
      {/* FORMULARIO DE PREINSCRIPCIÓN AL FINAL */}
      {/* ============================================== */}
      <section id="preinscripcion-form" className="iti-gradient-accent text-white py-16 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <GraduationCap className="h-12 w-12 mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold mb-2">¡Inicia tu carrera técnica con nosotros!</h2>
            <p className="opacity-90 max-w-2xl mx-auto">
              Formación académica, técnica y ocupacional de calidad. ¡Asegura tu futuro profesional!
              Complete el formulario para iniciar el proceso de preinscripción.
            </p>
          </div>

          {preSuccess ? (
            <Card className="max-w-3xl mx-auto border-green-500/40 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-2 text-green-700">¡Solicitud enviada con éxito!</h3>
                <p className="text-muted-foreground mb-6">
                  Su solicitud de preinscripción ha sido registrada en el sistema. Se ha enviado un correo electrónico
                  al estudiante y al padre/encargado confirmando la recepción.
                </p>
                <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> ¿Qué sigue?
                  </h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Su solicitud será revisada por el equipo administrativo del instituto.</li>
                    <li>Recibirá una notificación por correo cuando el estado cambie.</li>
                    <li>Si la preinscripción es <strong>aceptada</strong>, deberá presentarse presencialmente con la documentación requerida.</li>
                    <li>Una vez confirmada la inscripción presencial, recibirá un correo con instrucciones para <strong>activar su cuenta</strong> y crear su contraseña.</li>
                  </ol>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-sm mb-2">Datos registrados</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Estudiante</div>
                      <div className="font-medium">{preSuccess.preinscripcion.estudianteNombre}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Código</div>
                      <div className="font-medium">{preSuccess.preinscripcion.estudianteCodigo}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">Carrera solicitada</div>
                      <div className="font-medium">{preSuccess.preinscripcion.carreraNombre}</div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setPreSuccess(null)
                    setPreForm({ padreNombre: '', padreTelefono: '', padreEmail: '', estudianteNombre: '', estudianteCodigo: '', estudianteTelefono: '', estudianteEmail: '', carreraId: '' })
                  }}
                  variant="outline"
                >
                  Enviar otra solicitud
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Formulario de Preinscripción
                </CardTitle>
                <CardDescription>Todos los campos son obligatorios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pasos */}
                <div className="bg-muted/30 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-primary">
                    <ListChecks className="h-4 w-4" /> Proceso: Formulario → Revisión administrativa → Notificación → Inscripción presencial → Activación de cuenta
                  </div>
                </div>

                {/* Datos del padre */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Datos del Padre o Encargado
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="pre-padreNombre">Nombre completo *</Label>
                      <Input
                        id="pre-padreNombre"
                        value={preForm.padreNombre}
                        onChange={(e) => setPreForm({ ...preForm, padreNombre: e.target.value })}
                        placeholder="Nombre y apellidos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pre-padreTelefono">Teléfono *</Label>
                      <Input
                        id="pre-padreTelefono"
                        value={preForm.padreTelefono}
                        onChange={(e) => setPreForm({ ...preForm, padreTelefono: e.target.value })}
                        placeholder="0000-0000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="pre-padreEmail">Correo electrónico *</Label>
                      <Input
                        id="pre-padreEmail"
                        type="email"
                        value={preForm.padreEmail}
                        onChange={(e) => setPreForm({ ...preForm, padreEmail: e.target.value })}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Datos del estudiante */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Datos del Estudiante
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label htmlFor="pre-estudianteNombre">Nombre completo *</Label>
                      <Input
                        id="pre-estudianteNombre"
                        value={preForm.estudianteNombre}
                        onChange={(e) => setPreForm({ ...preForm, estudianteNombre: e.target.value })}
                        placeholder="Nombre y apellidos"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pre-estudianteCodigo">Código del estudiante *</Label>
                      <Input
                        id="pre-estudianteCodigo"
                        value={preForm.estudianteCodigo}
                        onChange={(e) => setPreForm({ ...preForm, estudianteCodigo: e.target.value })}
                        placeholder="Ej: EST-2025-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pre-estudianteTelefono">Teléfono *</Label>
                      <Input
                        id="pre-estudianteTelefono"
                        value={preForm.estudianteTelefono}
                        onChange={(e) => setPreForm({ ...preForm, estudianteTelefono: e.target.value })}
                        placeholder="0000-0000"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="pre-estudianteEmail">Correo electrónico *</Label>
                      <Input
                        id="pre-estudianteEmail"
                        type="email"
                        value={preForm.estudianteEmail}
                        onChange={(e) => setPreForm({ ...preForm, estudianteEmail: e.target.value })}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Carrera */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 pb-2 border-b flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" /> Carrera de Interés
                  </h3>
                  <Label htmlFor="pre-carrera">Seleccione la carrera *</Label>
                  <Select
                    value={preForm.carreraId}
                    onValueChange={(v) => setPreForm({ ...preForm, carreraId: v })}
                  >
                    <SelectTrigger id="pre-carrera">
                      <SelectValue placeholder="-- Seleccione una carrera --" />
                    </SelectTrigger>
                    <SelectContent>
                      {carreras.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aviso */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-md p-3 text-sm flex gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-blue-800 dark:text-blue-200">
                    <strong>Importante:</strong> Al enviar este formulario, se guardará su solicitud en nuestra base de datos.
                    Se enviará un correo confirmando la recepción. Deberá esperar la revisión del administrador para continuar con el proceso.
                  </div>
                </div>

                <Button
                  onClick={enviarPreinscripcion}
                  disabled={preLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {preLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" /> Enviar solicitud de preinscripción
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
