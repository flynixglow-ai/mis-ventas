import type { ReactNode } from 'react'

function Icono({ children, tamano = 24 }: { children: ReactNode; tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconoInicio = () => (
  <Icono>
    <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />
  </Icono>
)

export const IconoPedidos = () => (
  <Icono>
    <path d="M6 7h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </Icono>
)

export const IconoClientes = () => (
  <Icono>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.6-3.5 3.4-5.5 7-5.5s6.400 2 7 5.500" />
  </Icono>
)

export const IconoMas = () => (
  <Icono>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </Icono>
)

export const IconoSumar = () => (
  <Icono tamano={30}>
    <path d="M12 5v14M5 12h14" strokeWidth="2.4" />
  </Icono>
)

export const IconoAtras = () => (
  <Icono>
    <path d="m15 5-7 7 7 7" />
  </Icono>
)

export const IconoAdelante = () => (
  <Icono tamano={18}>
    <path d="m9 5 7 7-7 7" />
  </Icono>
)
