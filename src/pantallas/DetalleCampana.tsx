import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVistas } from '../datos/repositorios/consultas'
import { filtrarPedidos } from '../dominio/busqueda'
import { formatearFecha, hoy } from '../dominio/fechas'
import { contar, formatearPesos } from '../dominio/formato'
import { agrupar, calcularTotales } from '../dominio/reportes'
import { Boton } from '../ui/Boton'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { TarjetaPedido } from '../ui/Pedido'
import { TresCifras } from '../ui/Totales'
import { FormularioCampana } from './Campanas'

export function DetalleCampana() {
  const { id = '' } = useParams()
  const [editando, setEditando] = useState(false)
  const datos = useLiveQuery(
    async () => ({
      campana: (await db.campanas.get(id)) ?? null,
      marcas: await db.marcas.toArray(),
      pedidos: (await cargarVistas()).filter((v) => v.pedido.campanaId === id),
    }),
    [id],
  )
  if (!datos) return null
  const { campana, marcas } = datos
  if (!campana) return <Navigate to="/mas/campanas" replace />

  const fecha = hoy()
  const marca = marcas.find((m) => m.id === campana.marcaId)
  const pedidos = filtrarPedidos(datos.pedidos, {}, fecha)
  const t = calcularTotales(pedidos)
  const nombres = new Map(pedidos.map((v) => [v.cliente.id, v.cliente.nombre]))
  const clientes = [...agrupar(pedidos, (v) => v.pedido.clienteId)].sort(
    ([a, ta], [b, tb]) => tb.pendiente - ta.pendiente || nombres.get(a)!.localeCompare(nombres.get(b)!, 'es'),
  )

  return (
    <Pantalla titulo={campana.nombre} volverA="/mas/campanas">
      <div className="space-y-4">
        <Tarjeta>
          {/* La campaña siempre se muestra con su marca. */}
          <p aria-label="Marca de la campaña" className="text-sm font-semibold text-acento">
            {marca?.nombre}
          </p>
          <p className="mt-3 text-sm font-medium text-tenue">Total pendiente</p>
          <p aria-label="Total pendiente de la campaña" className="mt-1 text-[36px] font-bold leading-tight tracking-tight">
            {formatearPesos(t.pendiente)}
          </p>
          <div className="mt-4 border-t border-borde pt-4">
            <TresCifras cifras={t} etiqueta="Totales de la campaña" />
          </div>
        </Tarjeta>

        <dl aria-label="Conteos de la campaña" className="grid grid-cols-4 gap-2">
          {(
            [
              ['Clientes', t.clientes],
              ['Pedidos', t.pedidos],
              ['Pendientes', t.pedidosPendientes],
              ['Pagados', t.pedidosPagados],
            ] as const
          ).map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex flex-col rounded-2xl border border-borde bg-superficie px-1 py-3 text-center">
              <dt className="text-xs text-tenue">{etiqueta}</dt>
              <dd aria-label={`${etiqueta} de la campaña`} className="order-first text-xl font-bold">
                {valor}
              </dd>
            </div>
          ))}
        </dl>

        {(campana.fechaInicio || campana.fechaCierre || campana.notas) && (
          <Tarjeta>
            <dl className="space-y-3">
              {campana.fechaInicio && (
                <div className="flex justify-between gap-3">
                  <dt className="text-sm text-tenue">Inicio</dt>
                  <dd className="font-medium">{formatearFecha(campana.fechaInicio)}</dd>
                </div>
              )}
              {campana.fechaCierre && (
                <div className="flex justify-between gap-3">
                  <dt className="text-sm text-tenue">Cierre</dt>
                  <dd className="font-medium">{formatearFecha(campana.fechaCierre)}</dd>
                </div>
              )}
              {campana.notas && (
                <div>
                  <dt className="text-sm text-tenue">Notas</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{campana.notas}</dd>
                </div>
              )}
            </dl>
          </Tarjeta>
        )}

        {pedidos.length === 0 ? (
          <EstadoVacio titulo="Sin pedidos" detalle="Aún no hay ventas registradas en esta campaña." />
        ) : (
          <>
            <h2 className="px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-tenue">Clientes</h2>
            <ul aria-label="Clientes de la campaña" className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
              {clientes.map(([clienteId, tc]) => (
                <li key={clienteId}>
                  <Link to={`/clientes/${clienteId}`} className="flex min-h-14 items-center gap-3 px-5 py-3 active:bg-superficie-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{nombres.get(clienteId)}</span>
                      <span className="block text-sm text-tenue">
                        {contar(tc.pedidos, 'pedido', 'pedidos')} · {formatearPesos(tc.vendido)}
                      </span>
                    </span>
                    <span className={`shrink-0 font-semibold ${tc.pendiente > 0 ? 'text-aviso' : 'text-exito'}`}>
                      {tc.pendiente > 0 ? formatearPesos(tc.pendiente) : 'Al día'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-tenue">Pedidos</h2>
            <ul aria-label="Pedidos de la campaña" className="space-y-3">
              {pedidos.map((v) => (
                <TarjetaPedido key={v.pedido.id} vista={v} hoy={fecha} />
              ))}
            </ul>
          </>
        )}

        <Boton variante="secundario" onClick={() => setEditando(true)}>
          Editar campaña
        </Boton>
      </div>

      {/* Al eliminarla, la campaña deja de existir y la pantalla vuelve sola a la lista. */}
      {editando && <FormularioCampana campana={campana} marcas={marcas} alCerrar={() => setEditando(false)} />}
    </Pantalla>
  )
}
