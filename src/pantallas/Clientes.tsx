import { EstadoVacio, Pantalla } from '../ui/Pantalla'

export function Clientes() {
  return (
    <Pantalla titulo="Clientes">
      <EstadoVacio titulo="Sin clientes" detalle="Aquí verás cuánto ha comprado y pagado cada cliente." />
    </Pantalla>
  )
}
