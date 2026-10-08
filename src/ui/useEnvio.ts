import { useState, type FormEvent } from 'react'
import { erroresDe } from '../datos/errores'
import type { ErrorValidacion } from '../dominio/validaciones'

/** Ejecuta una acción de guardado y recoge los errores de validación para mostrarlos. */
export function useEnvio() {
  const [errores, setErrores] = useState<ErrorValidacion[]>([])
  const [enviando, setEnviando] = useState(false)

  async function enviar(accion: () => Promise<unknown>, evento?: FormEvent): Promise<boolean> {
    evento?.preventDefault()
    if (enviando) return false
    setEnviando(true)
    try {
      await accion()
      setErrores([])
      return true
    } catch (fallo) {
      setErrores(erroresDe(fallo))
      return false
    } finally {
      setEnviando(false)
    }
  }

  return { errores, enviando, enviar }
}
