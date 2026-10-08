import { EstadoVacio, Pantalla } from '../ui/Pantalla'

export function Pedidos() {
  return (
    <Pantalla titulo="Pedidos">
      <EstadoVacio titulo="Sin pedidos" detalle="Aquí verás todos tus pedidos y sus saldos." />
    </Pantalla>
  )
}
