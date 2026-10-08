import { useLiveQuery } from 'dexie-react-hooks'
import { cargarVistas } from '../datos/repositorios/consultas'
import { filtrarPedidos } from '../dominio/busqueda'
import { hoy } from '../dominio/fechas'
import { EstadoVacio, Pantalla } from '../ui/Pantalla'
import { TarjetaPedido } from '../ui/Pedido'

export function Pedidos() {
  const vistas = useLiveQuery(() => cargarVistas(), [])
  const fecha = hoy()
  const pedidos = vistas && filtrarPedidos(vistas, {}, fecha)

  return (
    <Pantalla titulo="Pedidos">
      {pedidos?.length === 0 && <EstadoVacio titulo="Sin pedidos" detalle="Toca ＋ para registrar tu primera venta." />}
      {pedidos && pedidos.length > 0 && (
        <ul aria-label="Pedidos" className="space-y-3">
          {pedidos.map((v) => (
            <TarjetaPedido key={v.pedido.id} vista={v} hoy={fecha} />
          ))}
        </ul>
      )}
    </Pantalla>
  )
}
