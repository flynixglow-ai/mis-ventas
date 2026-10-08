import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconoAdelante, IconoAtras } from './iconos'
import { useVolver } from './useVolver'

interface Props {
  titulo: string
  /** Si se indica, muestra el botón de volver; la ruta se usa si no hay pantalla anterior. */
  volverA?: string
  /** Botón de acción a la derecha del título. */
  accion?: ReactNode
  children: ReactNode
}

export function Pantalla({ titulo, volverA, accion, children }: Props) {
  const volver = useVolver(volverA ?? '/')
  return (
    <div className="animate-entrar px-5 pb-10 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header className="mb-5 flex min-h-11 items-center gap-2">
        {volverA && (
          <button
            type="button"
            onClick={volver}
            aria-label="Volver"
            className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-tenue active:bg-superficie"
          >
            <IconoAtras />
          </button>
        )}
        <h1 className="min-w-0 flex-1 truncate text-[28px] font-bold tracking-tight">{titulo}</h1>
        {accion}
      </header>
      {children}
    </div>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-tarjeta border border-borde bg-superficie p-5 ${className}`}>{children}</section>
}

export function EstadoVacio({ titulo, detalle, children }: { titulo: string; detalle: string; children?: ReactNode }) {
  return (
    <Tarjeta className="text-center">
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-sm text-tenue">{detalle}</p>
      {children && <div className="mt-4">{children}</div>}
    </Tarjeta>
  )
}

/** Lista agrupada en una sola tarjeta, con separadores. */
export function Lista({ children, etiqueta }: { children: ReactNode; etiqueta?: string }) {
  return (
    <ul aria-label={etiqueta} className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
      {children}
    </ul>
  )
}

interface PropsFila {
  titulo: string
  detalle?: string
  extra?: ReactNode
  a?: string
  alTocar?: () => void
  inicial?: boolean
}

export function Fila({ titulo, detalle, extra, a, alTocar, inicial }: PropsFila) {
  const contenido = (
    <>
      {inicial && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-acento/15 font-bold text-acento">
          {titulo.trim().charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{titulo}</span>
        {detalle && <span className="block truncate text-sm text-tenue">{detalle}</span>}
      </span>
      {extra}
      <span className="shrink-0 text-tenue">
        <IconoAdelante />
      </span>
    </>
  )
  const clase = 'flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left active:bg-superficie-2'
  return (
    <li>
      {a ? (
        <Link to={a} className={clase}>
          {contenido}
        </Link>
      ) : (
        <button type="button" onClick={alTocar} className={clase}>
          {contenido}
        </button>
      )}
    </li>
  )
}
