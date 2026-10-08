import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { cargarVista } from '../datos/repositorios/consultas'
import { eliminarAbono, eliminarPedido, registrarAbono } from '../datos/repositorios/pedidos'
import { resumirPedido, subtotalItem } from '../dominio/calculos'
import { formatearFecha, hoy } from '../dominio/fechas'
import { formatearNumeroPedido, formatearPesos } from '../dominio/formato'
import { ordenarAbonos } from '../dominio/historial'
import { ETIQUETA_METODO, type Abono, type Id } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { Campo, ErrorGeneral, claseEntrada, mensajeDe } from '../ui/Campo'
import { Confirmar, Hoja } from '../ui/Hoja'
import { Pantalla, Tarjeta } from '../ui/Pantalla'
import { EntradaDinero, EstadoPedido, SelectorMetodo } from '../ui/Pedido'
import { useEnvio } from '../ui/useEnvio'
import { useVolver } from '../ui/useVolver'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export function DetallePedido() {
  const { id = '' } = useParams()
  const volver = useVolver('/pedidos')
  const [abonando, setAbonando] = useState(false)
  const [abonoPorEliminar, setAbonoPorEliminar] = useState<Abono | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const { errores, enviar } = useEnvio()
  const vista = useLiveQuery(async () => (await cargarVista(id)) ?? null, [id])

  if (vista === undefined) return null
  if (vista === null) return <Navigate to="/pedidos" replace />

  const { pedido, items, cliente, marca, campana } = vista
  const abonos = ordenarAbonos(vista.abonos)
  const r = resumirPedido(vista, hoy())
  const numero = formatearNumeroPedido(pedido.numero)

  return (
    <Pantalla titulo={`Pedido ${numero}`} volverA="/pedidos">
      <div className="space-y-4">
        <ErrorGeneral errores={errores} />

        <Tarjeta>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-tenue">Saldo pendiente</p>
            <EstadoPedido resumen={r} />
          </div>
          <p aria-label="Saldo pendiente" className="mt-1 text-[40px] font-bold leading-tight tracking-tight">
            {formatearPesos(r.saldo)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-borde pt-4">
            <div>
              <dt className="text-sm text-tenue">Total</dt>
              <dd aria-label="Total del pedido" className="font-semibold">
                {formatearPesos(r.total)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-tenue">Total abonado</dt>
              <dd aria-label="Total abonado" className="font-semibold">
                {formatearPesos(r.abonado)}
              </dd>
            </div>
          </dl>
        </Tarjeta>

        {r.saldo > 0 && <Boton onClick={() => setAbonando(true)}>+ Registrar abono</Boton>}

        <Tarjeta>
          <dl className="space-y-3">
            <Dato etiqueta="Cliente">
              <Link to={`/clientes/${cliente.id}`} className="font-medium text-acento">
                {cliente.nombre}
              </Link>
            </Dato>
            <Dato etiqueta="Marca">{marca.nombre}</Dato>
            <Dato etiqueta="Campaña">{campana.nombre}</Dato>
            <Dato etiqueta="Fecha">{formatearFecha(pedido.fecha)}</Dato>
            {pedido.fechaLimite && <Dato etiqueta="Fecha límite">{formatearFecha(pedido.fechaLimite)}</Dato>}
            {pedido.notas && (
              <div>
                <dt className="text-sm text-tenue">Notas</dt>
                <dd className="mt-1 whitespace-pre-wrap">{pedido.notas}</dd>
              </div>
            )}
          </dl>
        </Tarjeta>

        <Seccion titulo="Productos">
          <ul aria-label="Productos" className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.nombre}</span>
                  <span className="block text-sm text-tenue">
                    {item.cantidad} × {formatearPesos(item.valorUnitario)}
                  </span>
                </span>
                <span className="font-semibold">{formatearPesos(subtotalItem(item))}</span>
              </li>
            ))}
            <li className="flex items-center justify-between bg-superficie-2 px-5 py-3 font-bold">
              <span>Total</span>
              <span>{formatearPesos(r.total)}</span>
            </li>
          </ul>
        </Seccion>

        <Seccion titulo="Historial de abonos">
          {abonos.length === 0 ? (
            <Tarjeta className="text-center text-sm text-tenue">Este pedido aún no tiene abonos.</Tarjeta>
          ) : (
            <ul aria-label="Historial de abonos" className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
              {abonos.map((abono) => (
                <li key={abono.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{formatearFecha(abono.fecha)}</span>
                    <span className="block truncate text-sm text-tenue">
                      {ETIQUETA_METODO[abono.metodo]}
                      {abono.nota && ` · ${abono.nota}`}
                    </span>
                  </span>
                  <span className="font-semibold text-exito">{formatearPesos(abono.valor)}</span>
                  <button
                    type="button"
                    aria-label={`Eliminar abono de ${formatearPesos(abono.valor)}`}
                    onClick={() => setAbonoPorEliminar(abono)}
                    className="-mr-2 px-2 py-2 text-sm font-medium text-tenue active:text-peligro"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <div className="space-y-3 pt-2">
          <Link
            to={`/pedidos/${pedido.id}/editar`}
            className="flex h-13 w-full items-center justify-center rounded-2xl border border-borde bg-superficie-2 font-semibold"
          >
            Editar pedido
          </Link>
          <Boton variante="peligro" onClick={() => setEliminando(true)}>
            Eliminar pedido
          </Boton>
        </div>
      </div>

      {abonando && <HojaAbono pedidoId={pedido.id} saldo={r.saldo} alCerrar={() => setAbonando(false)} />}
      {abonoPorEliminar && (
        <Confirmar
          titulo="¿Eliminar abono?"
          mensaje={`Se eliminará el abono de ${formatearPesos(abonoPorEliminar.valor)} del ${formatearFecha(abonoPorEliminar.fecha)} y el saldo del pedido volverá a subir.`}
          textoConfirmar="Eliminar abono"
          peligro
          alCancelar={() => setAbonoPorEliminar(null)}
          alConfirmar={() => {
            const abono = abonoPorEliminar
            setAbonoPorEliminar(null)
            void enviar(() => eliminarAbono(abono.id))
          }}
        />
      )}
      {eliminando && (
        <Confirmar
          titulo={`¿Eliminar el pedido ${numero}?`}
          mensaje={
            abonos.length > 0
              ? `Atención: este pedido tiene ${plural(abonos.length, 'abono', 'abonos')} por ${formatearPesos(r.abonado)}. Se eliminarán junto con el pedido y sus productos. No se puede deshacer.`
              : 'Se eliminarán el pedido y sus productos. No se puede deshacer.'
          }
          textoConfirmar="Eliminar pedido"
          peligro
          alCancelar={() => setEliminando(false)}
          alConfirmar={async () => {
            setEliminando(false)
            if (await enviar(() => eliminarPedido(pedido.id))) volver()
          }}
        />
      )}
    </Pantalla>
  )
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-sm text-tenue">{etiqueta}</dt>
      <dd className="min-w-0 truncate text-right font-medium">{children}</dd>
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-tenue">{titulo}</h2>
      {children}
    </section>
  )
}

function HojaAbono({ pedidoId, saldo, alCerrar }: { pedidoId: Id; saldo: number; alCerrar: () => void }) {
  const [valor, setValor] = useState(0)
  const [fecha, setFecha] = useState(hoy())
  const [metodo, setMetodo] = useState('efectivo')
  const [nota, setNota] = useState('')
  const { errores, enviando, enviar } = useEnvio()

  const guardar = () => registrarAbono(pedidoId, { valor, fecha, metodo, nota })

  return (
    <Hoja titulo="Registrar abono" alCerrar={alCerrar}>
      <form className="space-y-4" onSubmit={async (e) => (await enviar(guardar, e)) && alCerrar()} noValidate>
        <ErrorGeneral errores={errores} />
        <div className="flex items-center justify-between rounded-2xl bg-superficie-2 px-4 py-3">
          <span className="text-sm text-tenue">Saldo actual</span>
          <span className="text-lg font-bold">{formatearPesos(saldo)}</span>
        </div>
        <Campo etiqueta="Valor del abono" error={mensajeDe(errores, 'valor')}>
          <EntradaDinero valor={valor} alCambiar={setValor} />
        </Campo>
        <button type="button" onClick={() => setValor(saldo)} className="text-sm font-semibold text-acento">
          Pagar todo ({formatearPesos(saldo)})
        </button>
        <div>
          <span className="text-sm font-medium text-tenue">Método de pago</span>
          <SelectorMetodo valor={metodo} alCambiar={setMetodo} />
        </div>
        <Campo etiqueta="Fecha" error={mensajeDe(errores, 'fecha')}>
          <input type="date" className={claseEntrada} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo etiqueta="Nota" opcional>
          <input className={claseEntrada} value={nota} onChange={(e) => setNota(e.target.value)} autoComplete="off" />
        </Campo>
        <Boton type="submit" disabled={enviando}>
          Registrar abono
        </Boton>
      </form>
    </Hoja>
  )
}
