import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cambiarEstadoCliente, eliminarCliente } from '../datos/repositorios/clientes'
import { leerIndicativo } from '../datos/repositorios/ajustes'
import { cargarVistas } from '../datos/repositorios/consultas'
import { enlaceWhatsApp, mensajeResumenCliente } from '../dominio/whatsapp'
import { Hoja } from '../ui/Hoja'
import { filtrarPedidos } from '../dominio/busqueda'
import { hoy } from '../dominio/fechas'
import { formatearPesos } from '../dominio/formato'
import { calcularTotales } from '../dominio/reportes'
import { Boton } from '../ui/Boton'
import { ErrorGeneral, Insignia } from '../ui/Campo'
import { Confirmar } from '../ui/Hoja'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { TarjetaPedido } from '../ui/Pedido'
import { useEnvio } from '../ui/useEnvio'
import { FormularioCliente } from './FormularioCliente'

export function DetalleCliente() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState<'archivar' | 'eliminar' | null>(null)
  const [compartiendo, setCompartiendo] = useState(false)
  const { errores, enviar } = useEnvio()

  const datos = useLiveQuery(
    async () => ({
      cliente: await db.clientes.get(id),
      pedidos: (await cargarVistas()).filter((v) => v.pedido.clienteId === id),
      indicativo: await leerIndicativo(),
    }),
    [id],
  )
  if (!datos) return null
  const { cliente } = datos
  if (!cliente) return <Navigate to="/clientes" replace />

  const fecha = hoy()
  const pedidos = filtrarPedidos(datos.pedidos, {}, fecha)
  const totales = calcularTotales(pedidos)
  const archivado = cliente.estado === 'archivado'
  // Solo hay mensaje si el cliente tiene saldo pendiente.
  const mensaje = mensajeResumenCliente(cliente, pedidos)

  return (
    <Pantalla titulo={cliente.nombre} volverA="/clientes">
      <div className="space-y-4">
        <ErrorGeneral errores={errores} />

        <Tarjeta>
          <p className="text-sm font-medium text-tenue">Saldo pendiente</p>
          <p aria-label="Saldo pendiente del cliente" className="mt-1 text-[36px] font-bold leading-tight tracking-tight">
            {formatearPesos(totales.pendiente)}
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-borde pt-4">
            <div>
              <dt className="text-sm text-tenue">Total comprado</dt>
              <dd aria-label="Total comprado" className="font-semibold">
                {formatearPesos(totales.vendido)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-tenue">Total pagado</dt>
              <dd aria-label="Total pagado" className="font-semibold">
                {formatearPesos(totales.cobrado)}
              </dd>
            </div>
          </dl>
        </Tarjeta>

        <Tarjeta>
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-tenue">Teléfono</dt>
              <dd className="font-medium">{cliente.telefono || 'Sin teléfono'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-tenue">Estado</dt>
              <dd>{archivado ? <Insignia>Archivado</Insignia> : <Insignia tono="exito">Activo</Insignia>}</dd>
            </div>
            {cliente.notas && (
              <div>
                <dt className="text-sm text-tenue">Notas</dt>
                <dd className="mt-1 whitespace-pre-wrap">{cliente.notas}</dd>
              </div>
            )}
          </dl>
        </Tarjeta>

        <h2 className="px-1 pt-2 text-sm font-semibold uppercase tracking-wide text-tenue">Pedidos</h2>
        {pedidos.length === 0 ? (
          <EstadoVacio titulo="Sin pedidos" detalle="Aquí aparecerán los pedidos de este cliente y su saldo." />
        ) : (
          <ul aria-label="Pedidos del cliente" className="space-y-3">
            {pedidos.map((v) => (
              <TarjetaPedido key={v.pedido.id} vista={v} hoy={fecha} sinCliente />
            ))}
          </ul>
        )}

        <div className="space-y-3 pt-2">
          {mensaje && (
            <button
              type="button"
              onClick={() => setCompartiendo(true)}
              className="h-13 w-full rounded-2xl bg-exito font-semibold text-fondo transition-transform active:scale-[0.98]"
            >
              Enviar resumen por WhatsApp
            </button>
          )}
          {!archivado && (
            <Link
              to={`/pedidos/nuevo?cliente=${cliente.id}`}
              className={`flex h-13 w-full items-center justify-center rounded-2xl font-semibold ${
                mensaje ? 'border border-borde bg-superficie-2' : 'bg-acento text-white'
              }`}
            >
              + Nuevo pedido para {cliente.nombre.split(' ')[0]}
            </Link>
          )}
          <Boton variante="secundario" onClick={() => setEditando(true)}>
            Editar datos
          </Boton>
          {archivado ? (
            <Boton variante="secundario" onClick={() => enviar(() => cambiarEstadoCliente(cliente.id, 'activo'))}>
              Volver a activar
            </Boton>
          ) : (
            <Boton variante="secundario" onClick={() => setConfirmando('archivar')}>
              Archivar cliente
            </Boton>
          )}
          {pedidos.length === 0 && (
            <Boton variante="peligro" onClick={() => setConfirmando('eliminar')}>
              Eliminar cliente
            </Boton>
          )}
        </div>
      </div>

      {editando && <FormularioCliente cliente={cliente} alCerrar={() => setEditando(false)} />}
      {compartiendo && mensaje && (
        <HojaWhatsApp
          mensaje={mensaje}
          telefono={cliente.telefono}
          indicativo={datos.indicativo}
          alCerrar={() => setCompartiendo(false)}
        />
      )}
      {confirmando === 'archivar' && (
        <Confirmar
          titulo={`¿Archivar a ${cliente.nombre}?`}
          mensaje={
            (totales.pendiente > 0 ? `Atención: tiene un saldo pendiente de ${formatearPesos(totales.pendiente)}, que seguirá contando en lo que te deben. ` : '') +
            'Dejará de aparecer al crear pedidos. Sus pedidos y abonos se conservan y puedes reactivarlo cuando quieras.'
          }
          textoConfirmar="Archivar"
          alCancelar={() => setConfirmando(null)}
          alConfirmar={() => {
            setConfirmando(null)
            void enviar(() => cambiarEstadoCliente(cliente.id, 'archivado'))
          }}
        />
      )}
      {confirmando === 'eliminar' && (
        <Confirmar
          titulo={`¿Eliminar a ${cliente.nombre}?`}
          mensaje="Este cliente no tiene pedidos. Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          peligro
          alCancelar={() => setConfirmando(null)}
          alConfirmar={async () => {
            setConfirmando(null)
            if (await enviar(() => eliminarCliente(cliente.id))) navegar('/clientes', { replace: true })
          }}
        />
      )}
    </Pantalla>
  )
}

interface PropsWhatsApp {
  mensaje: string
  telefono: string
  indicativo: string
  alCerrar: () => void
}

/** Muestra el mensaje antes de enviarlo: nada sale del teléfono sin que se vea primero. */
function HojaWhatsApp({ mensaje, telefono, indicativo, alCerrar }: PropsWhatsApp) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Hoja titulo="Resumen para WhatsApp" alCerrar={alCerrar}>
      <div className="space-y-4">
        <p
          aria-label="Mensaje"
          className="max-h-[45dvh] select-text overflow-y-auto whitespace-pre-wrap rounded-2xl bg-superficie-2 px-4 py-3 text-sm"
        >
          {mensaje}
        </p>
        {!telefono.trim() && (
          <p className="text-sm text-tenue">Este cliente no tiene teléfono guardado: WhatsApp te dejará elegir el contacto.</p>
        )}
        <a
          href={enlaceWhatsApp(telefono, mensaje, indicativo)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 w-full items-center justify-center rounded-2xl bg-exito font-semibold text-fondo"
        >
          Abrir WhatsApp
        </a>
        <Boton variante="secundario" onClick={copiar}>
          {copiado ? 'Mensaje copiado' : 'Copiar mensaje'}
        </Boton>
      </div>
    </Hoja>
  )
}
