import { Link, NavLink, Outlet } from 'react-router-dom'
import type { ReactNode } from 'react'
import { IconoClientes, IconoInicio, IconoMas, IconoPedidos, IconoSumar } from '../ui/iconos'

/** Pantallas principales: contenido desplazable + barra inferior fija. */
export function ConBarra() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <Outlet />
      </div>
      <BarraInferior />
    </div>
  )
}

function BarraInferior() {
  return (
    <nav
      aria-label="Principal"
      className="border-t border-borde bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="grid h-16 grid-cols-5 items-center">
        <Pestana a="/" etiqueta="Inicio" icono={<IconoInicio />} />
        <Pestana a="/pedidos" etiqueta="Pedidos" icono={<IconoPedidos />} />
        <div className="flex justify-center">
          <Link
            to="/pedidos/nuevo"
            aria-label="Nuevo pedido"
            className="-mt-7 flex h-16 w-16 items-center justify-center rounded-full bg-acento text-white shadow-lg shadow-acento/40 ring-4 ring-fondo transition-transform active:scale-95"
          >
            <IconoSumar />
          </Link>
        </div>
        <Pestana a="/clientes" etiqueta="Clientes" icono={<IconoClientes />} />
        <Pestana a="/mas" etiqueta="Más" icono={<IconoMas />} />
      </div>
    </nav>
  )
}

function Pestana({ a, etiqueta, icono }: { a: string; etiqueta: string; icono: ReactNode }) {
  return (
    <NavLink
      to={a}
      end={a === '/'}
      className={({ isActive }) =>
        `flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
          isActive ? 'text-acento' : 'text-tenue'
        }`
      }
    >
      {icono}
      {etiqueta}
    </NavLink>
  )
}
