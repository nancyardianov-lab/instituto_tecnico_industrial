'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useRouterStore } from '@/lib/store'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import {
  Cpu, Building2, Scissors, Zap, Car, Clock, Target, Briefcase,
  GraduationCap, BookOpen, ArrowLeft, ArrowRight, Users, Award
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ICONS: Record<string, any> = {
  'computacion': Cpu,
  'dibujo-construccion': Building2,
  'costura-industrial': Scissors,
  'electricidad': Zap,
  'mecanica-automotriz': Car,
}

export function CarrerasView() {
  const { path, setPath } = useRouterStore()
  const { toast } = useToast()
  const [carreras, setCarreras] = useState<any[]>([])
  const [carreraSel, setCarreraSel] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/carreras')
      .then(r => r.json())
      .then(data => {
        setCarreras(data.carreras || [])
        setLoading(false)
      })
  }, [])

  // Si hay sub-ruta /carreras/[slug]
  useEffect(() => {
    const parts = path.split('/').filter(Boolean)
    if (parts[0] === 'carreras' && parts[1] && carreras.length > 0) {
      const c = carreras.find((x) => x.slug === parts[1])
      if (c) setCarreraSel(c)
      else setCarreraSel(null)
    } else {
      setCarreraSel(null)
    }
  }, [path, carreras])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Cargando carreras...</p>
      </div>
    )
  }

  // VISTA DETALLE DE CARRERA
  if (carreraSel) {
    const Icon = ICONS[carreraSel.slug] || BookOpen
    const galeria = JSON.parse(carreraSel.galeria || '[]')
    
    // Agrupar cursos por año
    const cursosPorAnio: Record<number, any[]> = { 4: [], 5: [], 6: [] }
    carreraSel.cursos?.forEach((c: any) => {
      if (!cursosPorAnio[c.anio]) cursosPorAnio[c.anio] = []
      cursosPorAnio[c.anio].push(c)
    })

    return (
      <div className="animate-fadeIn">
        {/* Hero */}
        <section className="relative h-[300px] md:h-[400px] overflow-hidden">
          <img
            src={carreraSel.imagen || '/instalaciones/foto_01.jpeg'}
            alt={carreraSel.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 pb-8 text-white">
            <button
              onClick={() => setPath('/carreras')}
              className="flex items-center gap-1 text-sm mb-3 hover:underline opacity-80"
            >
              <ArrowLeft className="h-4 w-4" /> Volver a carreras
            </button>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center">
                <Icon className="h-7 w-7 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-bold">{carreraSel.nombre}</h1>
                <Badge className="bg-accent text-accent-foreground mt-1">Duración: {carreraSel.duracion}</Badge>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Contenido principal */}
            <div className="md:col-span-2 space-y-6">
              {/* Descripción */}
              <Card className="iti-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Descripción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{carreraSel.descripcion}</p>
                </CardContent>
              </Card>

              {/* Objetivo */}
              <Card className="iti-card border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Target className="h-5 w-5" /> Objetivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{carreraSel.objetivo}</p>
                </CardContent>
              </Card>

              {/* Perfil del egresado */}
              <Card className="iti-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" /> Perfil del Egresado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{carreraSel.perfilEgresado}</p>
                </CardContent>
              </Card>

              {/* Campo laboral */}
              <Card className="iti-card border-accent/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent-foreground">
                    <Briefcase className="h-5 w-5" /> Campo Laboral
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{carreraSel.campoLaboral}</p>
                </CardContent>
              </Card>

              {/* Cursos por año */}
              <Card className="iti-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" /> Pensum de Cursos
                  </CardTitle>
                  <CardDescription>
                    Lista completa de cursos por año académico. Duración total: {carreraSel.duracion}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="anio-4">
                    {[4, 5, 6].map((anio) => (
                      <AccordionItem key={anio} value={`anio-${anio}`}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/10">{anio}° Año</Badge>
                            <span className="font-medium">
                              {cursosPorAnio[anio]?.length || 0} curso(s)
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {cursosPorAnio[anio]?.map((curso: any) => {
                              const pensum = JSON.parse(curso.pensum || '[]')
                              return (
                                <div key={curso.id} className="border rounded-md p-3 bg-muted/30">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-sm">{curso.nombre}</h4>
                                  </div>
                                  {pensum.length > 0 && (
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-xs">
                                        <thead className="border-b">
                                          <tr className="text-left text-muted-foreground">
                                            <th className="py-1.5 pr-3">Área / Asignatura</th>
                                            <th className="py-1.5 pr-3">Subárea</th>
                                            <th className="py-1.5 text-right">Periodos</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {pensum.map((p: any, i: number) => (
                                            <tr key={i} className="border-b border-border/40">
                                              <td className="py-1.5 pr-3 font-medium">{p.area}</td>
                                              <td className="py-1.5 pr-3 text-muted-foreground">{p.subarea || '—'}</td>
                                              <td className="py-1.5 text-right">{p.periodos}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {(!cursosPorAnio[anio] || cursosPorAnio[anio].length === 0) && (
                              <p className="text-sm text-muted-foreground">No hay cursos registrados.</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              {/* Galería de fotos */}
              {galeria.length > 0 && (
                <Card className="iti-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" /> Galería de la Carrera
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {galeria.map((img: string, i: number) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden iti-card">
                          <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <Card className="iti-card sticky top-20">
                <CardHeader>
                  <CardTitle className="text-base">Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Duración</div>
                      <div className="text-muted-foreground">{carreraSel.duracion}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Títulos obtenidos</div>
                      <div className="text-muted-foreground">Bachiller Industrial + Perito en {carreraSel.nombre.replace('Bachillerato Industrial y Perito en ', '').replace('Bachiller Industrial y Perito con Especialidad en ', '')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Estudiantes activos</div>
                      <div className="text-muted-foreground">{carreraSel._count?.estudiantes || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Cursos disponibles</div>
                      <div className="text-muted-foreground">{carreraSel.cursos?.length || 0} (de 4to a 6to)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="iti-card bg-primary text-primary-foreground">
                <CardContent className="p-4 text-center">
                  <p className="text-sm mb-3">¿Te interesa esta carrera?</p>
                  <Button
                    onClick={() => setPath('/preinscripcion')}
                    className="bg-accent text-accent-foreground hover:bg-accent/90 w-full"
                  >
                    Preinscribirse ahora <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // VISTA LISTADO CON CARRUSEL
  return (
    <div className="animate-fadeIn">
      {/* Hero */}
      <section className="iti-gradient text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Nuestras Carreras</h1>
          <p className="opacity-90 max-w-2xl mx-auto">
            Ofrecemos 5 carreras técnicas con una duración de 3 años. Al finalizar,
            obtienes dos títulos: Bachiller Industrial y Perito en la especialidad.
          </p>
        </div>
      </section>

      {/* Carrusel de carreras */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-xl font-bold mb-6 text-center">Explora nuestras carreras</h2>
        {carreras.length === 0 ? (
          <p className="text-center text-muted-foreground">No hay carreras disponibles.</p>
        ) : (
          <Carousel
            opts={{ align: 'start', loop: true }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {carreras.map((c) => {
                const Icon = ICONS[c.slug] || BookOpen
                return (
                  <CarouselItem key={c.id} className="md:basis-1/2 lg:basis-1/3">
                    <Card
                      className="iti-card cursor-pointer h-full overflow-hidden hover:border-primary/40"
                      onClick={() => setPath(`/carreras/${c.slug}`)}
                    >
                      <div className="relative h-40 overflow-hidden">
                        <img
                          src={c.imagen || '/instalaciones/foto_01.jpeg'}
                          alt={c.nombre}
                          className="w-full h-full object-cover transition-transform hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <div className="flex items-center gap-2 text-white">
                            <div className="w-8 h-8 rounded-full bg-accent/90 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-accent-foreground" />
                            </div>
                            <div className="font-semibold text-sm leading-tight">
                              {c.nombre.replace('Bachillerato Industrial y Perito en ', '').replace('Bachiller Industrial y Perito con Especialidad en ', '')}
                            </div>
                          </div>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                          {c.descripcion}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="h-3 w-3 mr-1" /> {c.duracion}
                          </Badge>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            Ver más <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                )
              })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        )}
      </section>

      {/* Listado completo */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-xl font-bold mb-6">Todas las carreras</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carreras.map((c) => {
            const Icon = ICONS[c.slug] || BookOpen
            return (
              <Card
                key={c.id}
                className="iti-card cursor-pointer overflow-hidden hover:border-primary/40"
                onClick={() => setPath(`/carreras/${c.slug}`)}
              >
                <div className="flex gap-3 p-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                    <img src={c.imagen || '/instalaciones/foto_01.jpeg'} alt={c.nombre} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-4 w-4 text-primary" />
                      <Badge variant="outline" className="text-[10px]">{c.duracion}</Badge>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">
                      {c.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.descripcion}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
