import { useLiveQuery } from 'dexie-react-hooks'
import { cargarVistas } from '../datos/repositorios/consultas'
import { formatearPesos } from '../dominio/formato'
import { calcularTotales } from '../dominio/reportes'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'

export function Inicio() {
  const vistas = useLiveQuery(() => cargarVistas(), [])
  const totales = calcularTotales(vistas ?? [])

  return (
    <Pantalla titulo="Mis Ventas">
      <Tarjeta className="mb-4">
        <p className="text-sm font-medium text-tenue">Total por cobrar</p>
        <p aria-label="Total por cobrar" className="mt-1 text-[40px] font-bold leading-tight tracking-tight">
          {formatearPesos(totales.pendiente)}
        </p>
      </Tarjeta>
      {vistas?.length === 0 && <EstadoVacio titulo="Aún no hay pedidos" detalle="Toca ＋ para registrar tu primera venta." />}
    </Pantalla>
  )
}
