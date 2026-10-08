import type { FechaHora, Id } from '../dominio/tipos'

export function nuevoId(): Id {
  // randomUUID no existe en http:// (pruebas por WiFi desde el teléfono).
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function ahora(): FechaHora {
  return new Date().toISOString()
}

/** Los campos opcionales vacíos no se guardan. */
export function opcional(texto: string | undefined): string | undefined {
  const limpio = texto?.trim()
  return limpio ? limpio : undefined
}
