import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { IconoAtras } from './iconos'

interface Props {
  titulo: string
  /** Si se indica, muestra el botón de volver hacia esa ruta. */
  volverA?: string
  children: ReactNode
}

export function Pantalla({ titulo, volverA, children }: Props) {
  return (
    <div className="animate-entrar px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <header className="mb-5 flex items-center gap-2">
        {volverA && (
          <Link
            to={volverA}
            aria-label="Volver"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-tenue active:bg-superficie"
          >
            <IconoAtras />
          </Link>
        )}
        <h1 className="text-[28px] font-bold tracking-tight">{titulo}</h1>
      </header>
      {children}
    </div>
  )
}

export function Tarjeta({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-tarjeta border border-borde bg-superficie p-5 ${className}`}>{children}</section>
}

export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <Tarjeta className="text-center">
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-sm text-tenue">{detalle}</p>
    </Tarjeta>
  )
}
