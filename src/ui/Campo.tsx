import type { ReactNode } from 'react'
import type { ErrorValidacion } from '../dominio/validaciones'

export const claseEntrada =
  'mt-1.5 block h-13 w-full rounded-2xl border border-borde bg-superficie-2 px-4 text-texto outline-none transition-colors placeholder:text-tenue/50 focus:border-acento'

export const claseArea = claseEntrada.replace('h-13', 'min-h-24 py-3')

export function mensajeDe(errores: readonly ErrorValidacion[], campo: string): string | undefined {
  return errores.find((e) => e.campo === campo)?.mensaje
}

interface Props {
  etiqueta: string
  opcional?: boolean
  error?: string
  children: ReactNode
}

/** Etiqueta + control + mensaje de error. El control va como hijo. */
export function Campo({ etiqueta, opcional, error, children }: Props) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-tenue">
        {etiqueta}
        {opcional && <span className="font-normal opacity-70"> · opcional</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-sm text-peligro">
          {error}
        </span>
      )}
    </label>
  )
}

/** Errores que no pertenecen a un campo concreto. */
export function ErrorGeneral({ errores }: { errores: readonly ErrorValidacion[] }) {
  const mensaje = mensajeDe(errores, '')
  if (!mensaje) return null
  return (
    <p role="alert" className="rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro">
      {mensaje}
    </p>
  )
}

export function Interruptor({
  etiqueta,
  detalle,
  activo,
  alCambiar,
}: {
  etiqueta: string
  detalle?: string
  activo: boolean
  alCambiar: (activo: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      onClick={() => alCambiar(!activo)}
      className="flex w-full items-center gap-3 rounded-2xl border border-borde bg-superficie-2 px-4 py-3 text-left"
    >
      <span className="flex-1">
        <span className="block font-medium">{etiqueta}</span>
        {detalle && <span className="block text-sm text-tenue">{detalle}</span>}
      </span>
      <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${activo ? 'bg-acento' : 'bg-borde'}`}>
        <span className={`h-6 w-6 rounded-full bg-white transition-transform ${activo ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

export function Insignia({ children, tono = 'tenue' }: { children: ReactNode; tono?: 'tenue' | 'exito' | 'aviso' | 'peligro' | 'acento' }) {
  const tonos = {
    tenue: 'bg-borde text-tenue',
    exito: 'bg-exito/15 text-exito',
    aviso: 'bg-aviso/15 text-aviso',
    peligro: 'bg-peligro/15 text-peligro',
    acento: 'bg-acento/15 text-acento',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tonos[tono]}`}>{children}</span>
}
