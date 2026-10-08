import type { ErrorValidacion } from '../dominio/validaciones'

/** Una regla del negocio impidió la operación. Trae los mensajes para mostrar. */
export class ErrorDeNegocio extends Error {
  readonly errores: ErrorValidacion[]

  constructor(errores: ErrorValidacion[]) {
    super(errores.map((e) => e.mensaje).join(' '))
    this.name = 'ErrorDeNegocio'
    this.errores = errores
  }
}

export function exigir(errores: ErrorValidacion[]): void {
  if (errores.length > 0) throw new ErrorDeNegocio(errores)
}

export function rechazar(mensaje: string): never {
  throw new ErrorDeNegocio([{ campo: '', mensaje }])
}

/** Convierte cualquier fallo en mensajes que la interfaz puede mostrar. */
export function erroresDe(fallo: unknown): ErrorValidacion[] {
  if (fallo instanceof ErrorDeNegocio) return fallo.errores
  console.error(fallo)
  return [{ campo: '', mensaje: 'No se pudo guardar. Intenta de nuevo.' }]
}
