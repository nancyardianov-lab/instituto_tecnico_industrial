'use client'

import { useRouterStore } from '@/lib/store'
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react'

export function Footer() {
  const { setPath } = useRouterStore()
  return (
    <footer className="mt-auto bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Institucional */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/institucional/logo.jpeg"
                alt="Logo ITI"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-accent/50 bg-white"
              />
              <div>
                <div className="font-bold text-base">Instituto Técnico Industrial</div>
                <div className="text-xs opacity-80">Adscrito al INEB - Jornada Vespertina</div>
              </div>
            </div>
            <p className="text-sm opacity-90 mb-4 max-w-md">
              "Solo la calidad nos hace competitivos". Institución educativa de servicio público
              comprometida con la formación académica, técnica y ocupacional de calidad.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-primary-foreground/15 hover:bg-accent transition-colors flex items-center justify-center"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-full bg-primary-foreground/15 hover:bg-accent transition-colors flex items-center justify-center"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="font-semibold mb-3 text-accent">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => setPath('/')} className="opacity-90 hover:opacity-100 hover:text-accent transition">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => setPath('/carreras')} className="opacity-90 hover:opacity-100 hover:text-accent transition">
                  Carreras
                </button>
              </li>
              <li>
                <button onClick={() => setPath('/preinscripcion')} className="opacity-90 hover:opacity-100 hover:text-accent transition">
                  Preinscripción
                </button>
              </li>
              <li>
                <button onClick={() => setPath('/contacto')} className="opacity-90 hover:opacity-100 hover:text-accent transition">
                  Contacto
                </button>
              </li>
              <li>
                <button onClick={() => setPath('/login')} className="opacity-90 hover:opacity-100 hover:text-accent transition">
                  Iniciar sesión
                </button>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold mb-3 text-accent">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-accent" />
                <span className="opacity-90">
                  7A. Avenida 6-07 Zona 2<br />
                  San Pedro Sacatepéquez, San Marcos
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" />
                <a href="tel:7760-2670" className="opacity-90 hover:opacity-100">7760-2670</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" />
                <a href="mailto:tecnicoindustrial@gmail.com" className="opacity-90 hover:opacity-100 break-all">
                  tecnicoindustrial@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-2 text-xs opacity-80">
          <p>© {new Date().getFullYear()} Instituto Técnico Industrial. Todos los derechos reservados.</p>
          <p>Creado por Acuerdo Ministerial No. 1007 del 30 de agosto de 1989</p>
        </div>
      </div>
    </footer>
  )
}
