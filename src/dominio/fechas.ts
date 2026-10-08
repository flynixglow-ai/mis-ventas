import type { Fecha } from './tipos'

/** Verdadero solo para fechas reales en formato AAAA-MM-DD. */
export function esFechaValida(texto: unknown): texto is Fecha {
  if (typeof texto !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [a, m, d] = texto.split('-').map(Number)
  const fecha = new Date(Date.UTC(a, m - 1, d))
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d
}

/** Fecha local del dispositivo, AAAA-MM-DD. */
export function hoy(ahora = new Date()): Fecha {
  const a = ahora.getFullYear()
  const m = String(ahora.getMonth() + 1).padStart(2, '0')
  const d = String(ahora.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** "2026-10-07" → "07/10/2026" */
export function formatearFecha(fecha: Fecha): string {
  const [a, m, d] = fecha.split('-')
  return `${d}/${m}/${a}`
}

/** "2026-10-07" → "2026-10" */
export function mesDe(fecha: Fecha): string {
  return fecha.slice(0, 7)
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** "2026-10" → "Octubre 2026" */
export function nombreMes(mes: string): string {
  const [a, m] = mes.split('-')
  return `${MESES[Number(m) - 1]} ${a}`
}
