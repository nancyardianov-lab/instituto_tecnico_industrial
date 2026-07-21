'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Book, Star, Download, Heart, MessageCircle, Send, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store'

export function EstudianteBiblioteca() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [libros, setLibros] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('TODOS')
  const [libroSel, setLibroSel] = useState<any>(null)
  const [comentarios, setComentarios] = useState<any[]>([])
  const [nuevoComentario, setNuevoComentario] = useState({ texto: '', calificacion: 5 })
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set())

  const cargarLibros = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoria !== 'TODOS') params.set('categoria', categoria)
    fetch(`/api/biblioteca?${params.toString()}`).then(r => r.json()).then(d => {
      setLibros(d.libros || [])
      setLoading(false)
    })
  }

  useEffect(() => { cargarLibros() }, [])
  useEffect(() => { cargarLibros() }, [search, categoria])

  const cargarComentarios = async (libroId: string) => {
    const res = await fetch(`/api/biblioteca/${libroId}/comentarios`)
    const data = await res.json()
    if (data.libro) {
      setLibroSel(data.libro)
      setComentarios(data.libro.comentarios || [])
    }
  }

  const comentar = async () => {
    if (!nuevoComentario.texto) return
    const res = await fetch(`/api/biblioteca/${libroSel.id}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoComentario),
    })
    const data = await res.json()
    if (data.ok) {
      toast({ title: 'Comentario publicado' })
      setNuevoComentario({ texto: '', calificacion: 5 })
      cargarComentarios(libroSel.id)
    }
  }

  const toggleFavorito = async (libroId: string) => {
    const res = await fetch(`/api/biblioteca/${libroId}/favorito`, { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      setFavoritos((prev) => {
        const next = new Set(prev)
        if (data.favorito) next.add(libroId)
        else next.delete(libroId)
        return next
      })
      toast({ title: data.favorito ? 'Añadido a favoritos' : 'Quitado de favoritos' })
    }
  }

  const descargarLibro = async (libro: any) => {
    if (!libro.archivoUrl || libro.archivoUrl === '#') {
      toast({ title: 'Sin archivo', description: 'Este libro no tiene un archivo para descargar', variant: 'destructive' })
      return
    }
    // Registrar descarga en el servidor (sin esperar a que termine)
    fetch(`/api/biblioteca/${libro.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'descarga' }),
    }).catch(() => {})
    // Si es una ruta local (/uploads/...) abrirla en una pestaña nueva
    // Si es una URL externa (https://...) también
    window.open(libro.archivoUrl, '_blank')
    toast({ title: 'Descargando...', description: libro.titulo })
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold mb-2">Biblioteca Virtual</h1>
        <p className="text-muted-foreground text-sm">
          Busca, descarga y comenta los libros disponibles.
        </p>
      </div>

      {/* Filtros */}
      <Card className="iti-card">
        <CardContent className="p-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, autor o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todas las categorías</SelectItem>
                <SelectItem value="COMPUTACION">Computación</SelectItem>
                <SelectItem value="DIBUJO">Dibujo</SelectItem>
                <SelectItem value="COSTURA">Costura</SelectItem>
                <SelectItem value="ELECTRICIDAD">Electricidad</SelectItem>
                <SelectItem value="MECANICA">Mecánica</SelectItem>
                <SelectItem value="ACADEMICA">Académica</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      {loading ? (
        <p className="text-muted-foreground">Cargando libros...</p>
      ) : libros.length === 0 ? (
        <Card className="iti-card">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Book className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>No se encontraron libros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libros.map((l) => (
            <Card key={l.id} className="iti-card flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {l.portada ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.portada} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Book className="h-7 w-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm line-clamp-2">{l.titulo}</CardTitle>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.autor}</div>
                    <Badge variant="outline" className="text-[10px] mt-1">{l.categoria}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{l.descripcion}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" /> {l._count?.comentarios || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {l._count?.favoritos || 0}
                  </span>
                  {l.paginas && <span>· {l.paginas} págs.</span>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => cargarComentarios(l.id)}>
                    <MessageCircle className="h-3 w-3 mr-1" /> Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleFavorito(l.id)}>
                    <Heart className={`h-4 w-4 ${favoritos.has(l.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => descargarLibro(l)} title="Descargar / Abrir archivo">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de comentarios */}
      <Dialog open={!!libroSel} onOpenChange={(o) => !o && setLibroSel(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {libroSel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Book className="h-5 w-5 text-primary" /> {libroSel.titulo}
                </DialogTitle>
                <div className="text-sm text-muted-foreground">
                  Por {libroSel.autor} · <Badge variant="outline" className="text-[10px]">{libroSel.categoria}</Badge>
                </div>
              </DialogHeader>

              {libroSel.descripcion && (
                <p className="text-sm text-muted-foreground">{libroSel.descripcion}</p>
              )}

              {libroSel.archivoUrl && libroSel.archivoUrl !== '#' && (
                <Button size="sm" className="bg-primary hover:bg-primary/90 mt-2" onClick={() => descargarLibro(libroSel)}>
                  <Download className="h-4 w-4 mr-2" /> Descargar / Abrir archivo
                </Button>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" /> Comentarios ({comentarios.length})
                </h4>
                
                {/* Formulario nuevo comentario */}
                <div className="bg-muted/30 rounded-md p-3 mb-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setNuevoComentario({ ...nuevoComentario, calificacion: n })}>
                        <Star className={`h-5 w-5 ${n <= nuevoComentario.calificacion ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    rows={2}
                    placeholder="Escribe tu comentario..."
                    value={nuevoComentario.texto}
                    onChange={(e) => setNuevoComentario({ ...nuevoComentario, texto: e.target.value })}
                  />
                  <Button size="sm" onClick={comentar} disabled={!nuevoComentario.texto}>
                    <Send className="h-3 w-3 mr-1" /> Publicar
                  </Button>
                </div>

                {/* Lista comentarios */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {comentarios.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">Aún no hay comentarios. ¡Sé el primero!</p>
                  ) : (
                    comentarios.map((c) => (
                      <div key={c.id} className="flex gap-2 p-2 rounded-md bg-muted/20">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={c.user.foto || ''} />
                          <AvatarFallback className="text-xs">{c.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-medium">{c.user.name}</div>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`h-3 w-3 ${i < c.calificacion ? 'fill-accent text-accent' : 'text-muted-foreground/30'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{c.texto}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
