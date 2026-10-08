export interface Archivo {
  nombre: string
  contenido: string
  tipo: string
}

export type Entrega = 'compartido' | 'descargado' | 'cancelado'

/**
 * Entrega archivos al usuario. En el teléfono abre el menú Compartir (Guardar
 * en Archivos, iCloud, Drive, WhatsApp…); en el computador los descarga.
 */
export async function entregarArchivos(archivos: Archivo[]): Promise<Entrega> {
  const files = archivos.map((a) => new File([a.contenido], a.nombre, { type: a.tipo }))
  const tactil = window.matchMedia('(pointer: coarse)').matches

  if (tactil && typeof navigator.share === 'function' && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files })
      return 'compartido'
    } catch (fallo) {
      if (fallo instanceof DOMException && fallo.name === 'AbortError') return 'cancelado'
      // Si compartir falla por otra razón, se intenta la descarga.
    }
  }

  for (const file of files) {
    const url = URL.createObjectURL(file)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = file.name
    document.body.append(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
  return 'descargado'
}

/** Días completos transcurridos desde una marca de tiempo ISO. */
export function diasDesde(iso: string, ahora = new Date()): number {
  return Math.max(0, Math.floor((ahora.getTime() - Date.parse(iso)) / 86_400_000))
}
