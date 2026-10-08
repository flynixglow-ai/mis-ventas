import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cargarVistas } from '../datos/repositorios/consultas'
import { nombreMes } from '../dominio/fechas'
import { contar } from '../dominio/formato'
import { agrupar, calcularTotales, reportePorMes } from '../dominio/reportes'
import type { PedidoVista } from '../dominio/tipos'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { FilaReporte, TresCifras } from '../ui/Totales'

const DIMENSIONES = { marca: 'Marca', campana: 'Campaña', cliente: 'Cliente', mes: 'Mes' } as const
type Dimension = keyof typeof DIMENSIONES

interface Fila {
  id: string
  titulo: string
  detalle?: string
  cifras: { vendido: number; cobrado: number; pendiente: number }
  a: string
}

function ultimoDia(mes: string): string {
  const [a, m] = mes.split('-').map(Number)
  return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`
}

function filasDe(dimension: Dimension, vistas: PedidoVista[]): Fila[] {
  if (dimension === 'mes') {
    return reportePorMes(vistas).map((m) => ({
      id: m.mes,
      titulo: nombreMes(m.mes),
      cifras: m,
      a: `/pedidos?desde=${m.mes}-01&hasta=${ultimoDia(m.mes)}`,
    }))
  }
  const clave = { marca: 'marcaId', campana: 'campanaId', cliente: 'clienteId' }[dimension] as 'marcaId' | 'campanaId' | 'clienteId'
  const ejemplo = new Map(vistas.map((v) => [v.pedido[clave], v]))
  return [...agrupar(vistas, (v) => v.pedido[clave])]
    .map(([id, t]) => {
      const v = ejemplo.get(id)!
      const pedidos = contar(t.pedidos, 'pedido', 'pedidos')
      if (dimension === 'marca') return { id, titulo: v.marca.nombre, detalle: pedidos, cifras: t, a: `/pedidos?marca=${id}` }
      if (dimension === 'cliente') return { id, titulo: v.cliente.nombre, detalle: pedidos, cifras: t, a: `/clientes/${id}` }
      return {
        id,
        // La campaña siempre se nombra con su marca: "Campaña 10" existe en varias.
        titulo: `${v.marca.nombre} — ${v.campana.nombre}`,
        detalle: `${pedidos} · ${contar(t.clientes, 'cliente', 'clientes')}`,
        cifras: t,
        a: `/mas/campanas/${id}`,
      }
    })
    .sort((a, b) => b.cifras.pendiente - a.cifras.pendiente || b.cifras.vendido - a.cifras.vendido || a.titulo.localeCompare(b.titulo, 'es'))
}

export function Reportes() {
  const [parametros, setParametros] = useSearchParams()
  const vistas = useLiveQuery(() => cargarVistas(), [])
  if (!vistas) return <Pantalla titulo="Reportes" volverA="/mas" children={null} />

  const pedida = parametros.get('por') as Dimension
  const dimension: Dimension = pedida in DIMENSIONES ? pedida : 'marca'
  const filas = filasDe(dimension, vistas)

  return (
    <Pantalla titulo="Reportes" volverA="/mas">
      {vistas.length === 0 ? (
        <EstadoVacio titulo="Sin datos todavía" detalle="Los reportes aparecen cuando registres tu primer pedido." />
      ) : (
        <div className="space-y-4">
          <Tarjeta>
            <p className="mb-3 text-sm font-medium text-tenue">Todo el negocio</p>
            <TresCifras cifras={calcularTotales(vistas)} etiqueta="Todo el negocio" />
          </Tarjeta>

          <div role="tablist" aria-label="Agrupar por" className="grid grid-cols-4 rounded-2xl bg-superficie p-1 text-sm font-semibold">
            {(Object.keys(DIMENSIONES) as Dimension[]).map((d) => (
              <button
                key={d}
                role="tab"
                aria-selected={dimension === d}
                onClick={() => setParametros({ por: d }, { replace: true })}
                className={`h-10 rounded-xl transition-colors ${dimension === d ? 'bg-superficie-2 text-texto' : 'text-tenue'}`}
              >
                {DIMENSIONES[d]}
              </button>
            ))}
          </div>

          <ul aria-label={`Por ${DIMENSIONES[dimension].toLowerCase()}`} className="space-y-3">
            {filas.map((f) => (
              <FilaReporte key={f.id} titulo={f.titulo} detalle={f.detalle} cifras={f.cifras} a={f.a} />
            ))}
          </ul>
        </div>
      )}
    </Pantalla>
  )
}
