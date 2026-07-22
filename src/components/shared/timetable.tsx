'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, User, BookOpen, Users, GraduationCap } from 'lucide-react'

export interface TimetableEntry {
  id: string
  curso: string
  docente?: string
  carrera?: string
  aula?: string | null
  horaInicio: string // "HH:MM"
  horaFin: string    // "HH:MM"
  dia: string        // LUNES, MARTES, MIERCOLES, JUEVES, VIERNES
  anio?: number
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES']
const DIAS_LABEL: Record<string, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
}

// Color palette for subjects (deterministic by curso name)
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-950/40',     border: 'border-blue-400 dark:border-blue-700',     text: 'text-blue-900 dark:text-blue-100' },
  { bg: 'bg-green-100 dark:bg-green-950/40',    border: 'border-green-400 dark:border-green-700',  text: 'text-green-900 dark:text-green-100' },
  { bg: 'bg-purple-100 dark:bg-purple-950/40',  border: 'border-purple-400 dark:border-purple-700',text: 'text-purple-900 dark:text-purple-100' },
  { bg: 'bg-amber-100 dark:bg-amber-950/40',    border: 'border-amber-400 dark:border-amber-700',  text: 'text-amber-900 dark:text-amber-100' },
  { bg: 'bg-rose-100 dark:bg-rose-950/40',      border: 'border-rose-400 dark:border-rose-700',    text: 'text-rose-900 dark:text-rose-100' },
  { bg: 'bg-cyan-100 dark:bg-cyan-950/40',      border: 'border-cyan-400 dark:border-cyan-700',    text: 'text-cyan-900 dark:text-cyan-100' },
  { bg: 'bg-indigo-100 dark:bg-indigo-950/40',  border: 'border-indigo-400 dark:border-indigo-700',text: 'text-indigo-900 dark:text-indigo-100' },
  { bg: 'bg-teal-100 dark:bg-teal-950/40',      border: 'border-teal-400 dark:border-teal-700',    text: 'text-teal-900 dark:text-teal-100' },
  { bg: 'bg-pink-100 dark:bg-pink-950/40',      border: 'border-pink-400 dark:border-pink-700',    text: 'text-pink-900 dark:text-pink-100' },
  { bg: 'bg-orange-100 dark:bg-orange-950/40',  border: 'border-orange-400 dark:border-orange-700',text: 'text-orange-900 dark:text-orange-100' },
]

function colorForSubject(curso: string) {
  let hash = 0
  for (let i = 0; i < curso.length; i++) {
    hash = (hash * 31 + curso.charCodeAt(i)) | 0
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

// Convierte "HH:MM" a minutos desde medianoche
function toMin(hm: string): number {
  const [h, m] = hm.split(':').map(Number)
  return h * 60 + m
}

function minToLabel(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface TimetableProps {
  entries: TimetableEntry[]
  title?: string
  subtitle?: string
  showCarrera?: boolean
  showDocente?: boolean
  showAula?: boolean
  showGrado?: boolean
  // Para mostrar encabezado del horario (carrera+grado del estudiante)
  headerInfo?: string
}

export function Timetable({
  entries,
  title,
  subtitle,
  showCarrera = false,
  showDocente = true,
  showAula = true,
  showGrado = false,
  headerInfo,
}: TimetableProps) {
  if (!entries || entries.length === 0) {
    return (
      <Card className="iti-card">
        <CardContent className="py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No hay clases en el horario. {title === 'Mi Horario' ? 'Inscríbete en materias desde "Inscripción a Materias" para verlas aquí.' : 'Agrega horarios a las materias para verlos aquí.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calcular rango de horas
  const allMin = entries.flatMap(e => [toMin(e.horaInicio), toMin(e.horaFin)])
  const minStart = Math.min(...allMin)
  const maxEnd = Math.max(...allMin)
  // Redondear a la hora más cercana hacia abajo/arriba
  const startMin = Math.floor(minStart / 60) * 60
  const endMin = Math.ceil(maxEnd / 60) * 60

  // Generar lista de horas (cada 30 min para gridlines, cada 60 min para labels)
  const horaSlots: number[] = []
  for (let m = startMin; m <= endMin; m += 30) horaSlots.push(m)
  const horaLabels: number[] = []
  for (let m = startMin; m <= endMin; m += 60) horaLabels.push(m)

  const totalMin = endMin - startMin
  const CELL_HEIGHT = 30 // 30 px por cada 30 min → 60 px por hora

  // Indexar entries por dia
  const porDia: Record<string, TimetableEntry[]> = {}
  for (const d of DIAS) porDia[d] = []
  for (const e of entries) {
    if (!porDia[e.dia]) porDia[e.dia] = []
    porDia[e.dia].push(e)
  }

  return (
    <div className="space-y-4">
      {headerInfo && (
        <div className="text-center text-sm font-medium text-muted-foreground bg-muted/30 rounded-md py-2 px-3">
          {headerInfo}
        </div>
      )}

      <Card className="iti-card overflow-hidden">
        {title && (
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> {title}
            </CardTitle>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </CardHeader>
        )}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header de días */}
              <div
                className="grid border-b border-border bg-muted/30"
                style={{ gridTemplateColumns: `80px repeat(${DIAS.length}, 1fr)` }}
              >
                <div className="p-2 text-xs font-semibold text-center border-r border-border uppercase tracking-wide">
                  Hora
                </div>
                {DIAS.map(d => {
                  const totalClasesDia = porDia[d]?.length || 0
                  return (
                    <div key={d} className="p-2 text-xs font-semibold text-center border-r border-border last:border-r-0 uppercase tracking-wide">
                      {DIAS_LABEL[d]}
                      {totalClasesDia > 0 && (
                        <span className="ml-1 text-[10px] text-muted-foreground normal-case">({totalClasesDia})</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Grid con filas por hora */}
              <div
                className="relative grid border-b border-border"
                style={{
                  gridTemplateColumns: `80px repeat(${DIAS.length}, 1fr)`,
                  height: `${(totalMin / 30) * CELL_HEIGHT}px`,
                }}
              >
                {/* Columna de horas */}
                <div className="relative border-r border-border">
                  {horaLabels.map((m, i) => (
                    <div
                      key={m}
                      className="absolute right-1 text-[10px] text-muted-foreground font-medium -translate-y-1/2"
                      style={{ top: `${((m - startMin) / 30) * CELL_HEIGHT}px` }}
                    >
                      {minToLabel(m)}
                    </div>
                  ))}
                </div>

                {/* Columnas de días */}
                {DIAS.map(dia => (
                  <div key={dia} className="relative border-r border-border last:border-r-0">
                    {/* Gridlines cada 30 min */}
                    {horaSlots.map((m, i) => (
                      <div
                        key={m}
                        className={`absolute left-0 right-0 ${i % 2 === 0 ? 'border-t border-border/50' : 'border-t border-border/20'}`}
                        style={{ top: `${((m - startMin) / 30) * CELL_HEIGHT}px` }}
                      />
                    ))}

                    {/* Bloques de clases */}
                    {(porDia[dia] || []).map(entry => {
                      const top = ((toMin(entry.horaInicio) - startMin) / 30) * CELL_HEIGHT
                      const height = ((toMin(entry.horaFin) - toMin(entry.horaInicio)) / 30) * CELL_HEIGHT
                      const color = colorForSubject(entry.curso)
                      return (
                        <div
                          key={entry.id}
                          className={`absolute left-0.5 right-0.5 rounded-md border-l-4 ${color.bg} ${color.border} ${color.text} p-1 overflow-hidden`}
                          style={{ top: `${top}px`, height: `${height - 2}px`, minHeight: '24px' }}
                          title={`${entry.curso}${entry.anio ? ` — ${entry.anio}° año` : ''}${entry.docente ? ` — ${entry.docente}` : ''} — ${entry.horaInicio} a ${entry.horaFin}`}
                        >
                          <div className="text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2">
                            {entry.curso}
                          </div>
                          {height >= 50 && showDocente && entry.docente && (
                            <div className="text-[9px] sm:text-[10px] flex items-center gap-0.5 mt-0.5 opacity-80 line-clamp-1">
                              <User className="h-2.5 w-2.5 flex-shrink-0" /> {entry.docente}
                            </div>
                          )}
                          {height >= 50 && showGrado && entry.anio && (
                            <div className="text-[9px] sm:text-[10px] flex items-center gap-0.5 mt-0.5 opacity-80 line-clamp-1">
                              <GraduationCap className="h-2.5 w-2.5 flex-shrink-0" /> {entry.anio}° año
                            </div>
                          )}
                          {height >= 70 && showAula && entry.aula && (
                            <div className="text-[9px] sm:text-[10px] flex items-center gap-0.5 opacity-80 line-clamp-1">
                              <MapPin className="h-2.5 w-2.5 flex-shrink-0" /> {entry.aula}
                            </div>
                          )}
                          {height >= 90 && showCarrera && entry.carrera && (
                            <div className="text-[9px] sm:text-[10px] flex items-center gap-0.5 opacity-70 line-clamp-1">
                              <BookOpen className="h-2.5 w-2.5 flex-shrink-0" /> {entry.carrera}
                            </div>
                          )}
                          {height >= 40 && (
                            <div className="text-[9px] opacity-70 mt-0.5">
                              {entry.horaInicio} - {entry.horaFin}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper para construir entradas desde un horarioPorDia
export function entriesFromHorarioPorDia(horarioPorDia: Record<string, any[]>): TimetableEntry[] {
  const entries: TimetableEntry[] = []
  for (const [dia, clases] of Object.entries(horarioPorDia)) {
    for (const c of clases) {
      entries.push({
        id: c.id,
        curso: c.curso,
        docente: c.docente,
        carrera: c.carrera,
        aula: c.aula,
        horaInicio: c.horaInicio,
        horaFin: c.horaFin,
        dia,
        anio: c.anio,
      })
    }
  }
  return entries
}
