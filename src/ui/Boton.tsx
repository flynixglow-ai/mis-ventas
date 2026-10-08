import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'peligro' | 'compacto'

const ESTILOS: Record<Variante, string> = {
  primario: 'h-13 w-full bg-acento text-white active:bg-acento-fuerte',
  secundario: 'h-13 w-full border border-borde bg-superficie-2 text-texto',
  peligro: 'h-13 w-full border border-peligro/40 bg-peligro/10 text-peligro',
  compacto: 'h-10 bg-acento/15 px-4 text-sm text-acento',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
}

export function Boton({ variante = 'primario', className = '', type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={`rounded-2xl font-semibold transition-transform active:scale-[0.98] disabled:opacity-40 ${ESTILOS[variante]} ${className}`}
      {...resto}
    />
  )
}
