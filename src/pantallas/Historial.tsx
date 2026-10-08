import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cargarVistas } from '../datos/repositorios/consultas'
import { formatearFecha } from '../dominio/fechas'
import { formatearNumeroPedido, formatearPesos } from '../dominio/formato'
import { ETIQUETA_MOVIMIENTO, construirHistorial, type Movimiento } from '../dominio/historial'
import { ETIQUETA_METODO } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { EstadoVacio, Pantalla } from '../ui/Pantalla'

const POR_PAGINA = 60

const COLOR: Record<Movimiento['tipo'], string> = {
  venta: 'text-texto',
  abono: 'text-exito',
  pagada: 'text-acento',
}

export function Historial() {
  const [visibles, setVisibles] = useState(POR_PAGINA)
  const vistas = useLiveQuery(() => cargarVistas(), [])
  if (!vistas) return <Pantalla titulo="Historial" volverA="/mas" children={null} />

  const porPedido = new Map(vistas.map((v) => [v.pedido.id, v]))
  const movimientos = construirHistorial(vistas)

  // Se agrupan por día, conservando el orden (lo más reciente primero).
  const dias: { fecha: string; movimientos: Movimiento[] }[] = []
  for (const m of movimientos.slice(0, visibles)) {
    const ultimo = dias.at(-1)
    if (ultimo?.fecha === m.fecha) ultimo.movimientos.push(m)
    else dias.push({ fecha: m.fecha, movimientos: [m] })
  }

  return (
    <Pantalla titulo="Historial" volverA="/mas">
      {movimientos.length === 0 && <EstadoVacio titulo="Sin movimientos" detalle="Aquí verás las ventas y los abonos que registres." />}
      <div className="space-y-5">
        {dias.map((dia) => (
          <section key={dia.fecha} aria-label={formatearFecha(dia.fecha)}>
            <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-tenue">{formatearFecha(dia.fecha)}</h2>
            <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
              {dia.movimientos.map((m, i) => {
                const v = porPedido.get(m.pedidoId)!
                return (
                  <li key={`${m.pedidoId}-${m.tipo}-${i}`}>
                    <Link to={`/pedidos/${m.pedidoId}`} className="flex items-center gap-3 px-5 py-3 active:bg-superficie-2">
                      <span className="min-w-0 flex-1">
                        <span className={`block text-xs font-semibold uppercase tracking-wide ${COLOR[m.tipo]}`}>
                          {ETIQUETA_MOVIMIENTO[m.tipo]}
                        </span>
                        <span className="block truncate font-medium">
                          Pedido {formatearNumeroPedido(m.numero)} · {v.cliente.nombre}
                        </span>
                        <span className="block truncate text-sm text-tenue">
                          {m.tipo === 'abono' && m.metodo ? ETIQUETA_METODO[m.metodo] : `${v.marca.nombre} — ${v.campana.nombre}`}
                        </span>
                      </span>
                      <span className={`shrink-0 font-semibold ${COLOR[m.tipo]}`}>
                        {m.tipo === 'pagada' ? 'Saldo $0' : formatearPesos(m.valor)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
        {movimientos.length > visibles && (
          <Boton variante="secundario" onClick={() => setVisibles((n) => n + POR_PAGINA)}>
            Ver movimientos anteriores
          </Boton>
        )}
      </div>
    </Pantalla>
  )
}
