import { useNavigate } from 'react-router-dom'

/**
 * Vuelve a la pantalla anterior. Si la app se abrió directamente en esta
 * pantalla (no hay anterior), va a la ruta de respaldo.
 */
export function useVolver(respaldo: string) {
  const navegar = useNavigate()
  return () => {
    const indice = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (indice > 0) navegar(-1)
    else navegar(respaldo, { replace: true })
  }
}
