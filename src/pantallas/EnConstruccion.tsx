import { EstadoVacio, Pantalla } from '../ui/Pantalla'

/** Marcador de posición para pantallas de etapas posteriores. */
export function EnConstruccion({ titulo, volverA }: { titulo: string; volverA: string }) {
  return (
    <div className="h-full overflow-y-auto">
      <Pantalla titulo={titulo} volverA={volverA}>
        <EstadoVacio titulo="Próximamente" detalle="Esta sección se construye en una etapa posterior." />
      </Pantalla>
    </div>
  )
}
