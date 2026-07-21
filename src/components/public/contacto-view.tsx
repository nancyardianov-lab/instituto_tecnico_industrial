'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'

export function ContactoView() {
  const { toast } = useToast()
  const [faqs, setFaqs] = useState<any[]>([])
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' })

  useEffect(() => {
    fetch('/api/faq').then(r => r.json()).then(d => setFaqs(d.faqs || []))
  }, [])

  const enviar = () => {
    if (!form.nombre || !form.email || !form.mensaje) {
      toast({ title: 'Error', description: 'Complete los campos obligatorios', variant: 'destructive' })
      return
    }
    toast({ title: 'Mensaje enviado', description: 'Nos pondremos en contacto pronto.' })
    setForm({ nombre: '', email: '', asunto: '', mensaje: '' })
  }

  return (
    <div className="animate-fadeIn">
      <section className="iti-gradient text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Contacto</h1>
          <p className="opacity-90">Estamos para servirle. Contáctenos por cualquier medio.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Información */}
          <div className="space-y-4">
            <Card className="iti-card">
              <CardHeader>
                <CardTitle className="text-base">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dirección</div>
                    <div className="text-sm text-muted-foreground">
                      7A. Avenida 6-07 Zona 2, San Pedro Sacatepéquez, San Marcos
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Teléfono</div>
                    <a href="tel:7760-2670" className="text-sm text-muted-foreground hover:text-primary">7760-2670</a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Correo electrónico</div>
                    <a href="mailto:tecnicoindustrial@gmail.com" className="text-sm text-muted-foreground hover:text-primary break-all">
                      tecnicoindustrial@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Horario de atención</div>
                    <div className="text-sm text-muted-foreground">
                      Lunes a Viernes: 14:00 - 18:30 horas<br />
                      Jornada Vespertina
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="iti-card">
              <CardHeader>
                <CardTitle className="text-base">Redes Sociales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    <Facebook className="h-5 w-5" /> Facebook
                  </a>
                  <a
                    href="#"
                    className="flex-1 flex items-center justify-center gap-2 p-3 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition"
                  >
                    <Instagram className="h-5 w-5" /> Instagram
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulario */}
          <Card className="iti-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Envíenos un mensaje
              </CardTitle>
              <CardDescription>Le responderemos a la brevedad posible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="c-nombre">Nombre *</Label>
                <Input
                  id="c-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="c-email">Email *</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="c-asunto">Asunto</Label>
                <Input
                  id="c-asunto"
                  value={form.asunto}
                  onChange={(e) => setForm({ ...form, asunto: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="c-msg">Mensaje *</Label>
                <Textarea
                  id="c-msg"
                  rows={5}
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                />
              </div>
              <Button onClick={enviar} className="w-full bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Enviar mensaje
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Mapa */}
        <Card className="iti-card overflow-hidden mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[450px]">
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
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="iti-card">
          <CardHeader>
            <CardTitle>Preguntas Frecuentes</CardTitle>
            <CardDescription>Respuestas a las consultas más comunes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((f: any) => (
                <AccordionItem key={f.id} value={`faq-${f.id}`}>
                  <AccordionTrigger>{f.pregunta}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.respuesta}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
