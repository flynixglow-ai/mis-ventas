import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'

export function Inicio() {
  return (
    <Pantalla titulo="Mis Ventas">
      <Tarjeta className="mb-4">
        <p className="text-sm font-medium text-tenue">Total por cobrar</p>
        <p className="mt-1 text-[40px] font-bold leading-tight tracking-tight">$0</p>
      </Tarjeta>
      <EstadoVacio titulo="Aún no hay pedidos" detalle="Toca ＋ para registrar tu primera venta." />
    </Pantalla>
  )
}
