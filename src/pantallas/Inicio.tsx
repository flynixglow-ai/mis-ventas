import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVistas } from '../datos/repositorios/consultas'
import { CLAVE_ULTIMA_COPIA } from '../datos/respaldo/respaldo'
import { totalAbonado, totalPedido } from '../dominio/calculos'
import { hoy, mesDe, nombreMes } from '../dominio/fechas'
import { formatearNumeroPedido, formatearPesos } from '../dominio/formato'
import { calcularTotales, mayoresSaldos, pendientesRecientes, reporteDelMes } from '../dominio/reportes'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { diasDesde } from '../ui/archivos'

/** Días sin copia a partir de los cuales Inicio lo recuerda. */
const DIAS_AVISO_COPIA = 7
const MAXIMO_EN_LISTAS = 5

export function Inicio() {
  const vistas = useLiveQuery(() => cargarVistas(), [])
  const ultimaCopia = useLiveQuery(async () => (await db.meta.get(CLAVE_ULTIMA_COPIA))?.valor ?? null, [])
  if (!vistas) return <Pantalla titulo="Mis Ventas" children={null} />

  const totales = calcularTotales(vistas)
  const mes = reporteDelMes(vistas, mesDe(hoy()))
  const nombres = new Map(vistas.map((v) => [v.cliente.id, v.cliente.nombre]))
  const saldos = mayoresSaldos(vistas, MAXIMO_EN_LISTAS)
  const recientes = pendientesRecientes(vistas, MAXIMO_EN_LISTAS)

  const hayDatos = vistas.length > 0
  const sinCopiaReciente =
    ultimaCopia === null || (typeof ultimaCopia === 'string' && diasDesde(ultimaCopia) >= DIAS_AVISO_COPIA)

  return (
    <Pantalla titulo="Mis Ventas">
      <div className="space-y-4">
        <Tarjeta>
          <p className="text-sm font-medium text-tenue">Total por cobrar</p>
          <p aria-label="Total por cobrar" className="mt-1 text-[40px] font-bold leading-tight tracking-tight">
            {formatearPesos(totales.pendiente)}
          </p>
        </Tarjeta>

        {hayDatos && sinCopiaReciente && (
          <Link to="/mas/copia" className="block rounded-tarjeta border border-aviso/40 bg-aviso/10 px-5 py-4 active:bg-aviso/20">
            <span className="block font-semibold text-aviso">Haz una copia de seguridad</span>
            <span className="block text-sm text-tenue">
              {ultimaCopia === null
                ? 'Aún no has guardado ninguna copia de tus datos.'
                : `Tu última copia es de hace ${diasDesde(String(ultimaCopia))} días.`}
            </span>
          </Link>
        )}

        {!hayDatos && <EstadoVacio titulo="Aún no hay pedidos" detalle="Toca ＋ para registrar tu primera venta." />}

        {hayDatos && (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <Contador etiqueta="Clientes con saldo" valor={totales.clientesConSaldo} />
              <Contador etiqueta="Pedidos pendientes" valor={totales.pedidosPendientes} />
              <Contador etiqueta="Pedidos pagados" valor={totales.pedidosPagados} />
            </dl>

            <Seccion titulo={`Este mes · ${nombreMes(mes.mes)}`}>
              <Tarjeta>
                <dl aria-label="Este mes" className="space-y-3">
                  <Linea etiqueta="Vendido" valor={mes.vendido} />
                  <Linea etiqueta="Cobrado" valor={mes.cobrado} />
                  <Linea etiqueta="Pendiente" valor={mes.pendiente} resaltar />
                </dl>
              </Tarjeta>
            </Seccion>

            {saldos.length > 0 && (
              <Seccion titulo="Clientes con mayor saldo">
                <ul aria-label="Clientes con mayor saldo" className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
                  {saldos.map((s) => (
                    <li key={s.clienteId}>
                      <Link to={`/clientes/${s.clienteId}`} className="flex min-h-14 items-center gap-3 px-5 py-3 active:bg-superficie-2">
                        <span className="min-w-0 flex-1 truncate font-medium">{nombres.get(s.clienteId)}</span>
                        <span className="font-semibold text-aviso">{formatearPesos(s.saldo)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Seccion>
            )}

            {recientes.length > 0 && (
              <Seccion titulo="Pendientes recientes">
                <ul aria-label="Pendientes recientes" className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
                  {recientes.map((v) => (
                    <li key={v.pedido.id}>
                      <Link to={`/pedidos/${v.pedido.id}`} className="flex items-center gap-3 px-5 py-3 active:bg-superficie-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {formatearNumeroPedido(v.pedido.numero)} · {v.cliente.nombre}
                          </span>
                          <span className="block truncate text-sm text-tenue">
                            {v.marca.nombre} — {v.campana.nombre}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-xs text-tenue">Pendiente</span>
                          <span className="block font-semibold text-aviso">
                            {formatearPesos(totalPedido(v.items) - totalAbonado(v.abonos))}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Seccion>
            )}
          </>
        )}
      </div>
    </Pantalla>
  )
}

function Contador({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="flex flex-col rounded-tarjeta border border-borde bg-superficie px-3 py-4 text-center">
      <dt className="mt-1 text-xs leading-tight text-tenue">{etiqueta}</dt>
      <dd aria-label={etiqueta} className="order-first text-2xl font-bold">
        {valor}
      </dd>
    </div>
  )
}

function Linea({ etiqueta, valor, resaltar }: { etiqueta: string; valor: number; resaltar?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-tenue">{etiqueta}</dt>
      <dd aria-label={`${etiqueta} este mes`} className={`font-semibold ${resaltar && valor > 0 ? 'text-aviso' : ''}`}>
        {formatearPesos(valor)}
      </dd>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-tenue">{titulo}</h2>
      {children}
    </section>
  )
}
