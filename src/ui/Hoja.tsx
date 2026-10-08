import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Boton } from './Boton'
import { IconoCerrar } from './iconos'

interface PropsHoja {
  titulo: string
  alCerrar: () => void
  children: ReactNode
}

/** Hoja inferior: los formularios suben desde abajo, al alcance del pulgar. */
export function Hoja({ titulo, alCerrar, children }: PropsHoja) {
  useEffect(() => {
    const conEscape = (e: KeyboardEvent) => e.key === 'Escape' && alCerrar()
    document.addEventListener('keydown', conEscape)
    return () => document.removeEventListener('keydown', conEscape)
  }, [alCerrar])

  // Portal: un ancestro con transform (las animaciones) confinaría el position: fixed.
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 animate-aparecer bg-black/60" onClick={alCerrar} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative max-h-[92dvh] w-full max-w-md animate-subir overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-borde bg-superficie px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-borde" />
        <div className="mb-5 flex items-center">
          <h2 className="flex-1 text-xl font-bold tracking-tight">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={alCerrar}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-tenue active:bg-superficie-2"
          >
            <IconoCerrar />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface PropsConfirmar {
  titulo: string
  mensaje: string
  textoConfirmar: string
  peligro?: boolean
  alConfirmar: () => void
  alCancelar: () => void
}

export function Confirmar({ titulo, mensaje, textoConfirmar, peligro, alConfirmar, alCancelar }: PropsConfirmar) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 animate-aparecer bg-black/70" onClick={alCancelar} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-sm animate-entrar rounded-[28px] border border-borde bg-superficie p-6"
      >
        <h2 className="text-lg font-bold">{titulo}</h2>
        <p className="mt-2 text-tenue">{mensaje}</p>
        <div className="mt-6 space-y-3">
          <Boton variante={peligro ? 'peligro' : 'primario'} onClick={alConfirmar}>
            {textoConfirmar}
          </Boton>
          <Boton variante="secundario" onClick={alCancelar}>
            Cancelar
          </Boton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
