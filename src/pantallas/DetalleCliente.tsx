import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cambiarEstadoCliente, eliminarCliente } from '../datos/repositorios/clientes'
import { Boton } from '../ui/Boton'
import { ErrorGeneral, Insignia } from '../ui/Campo'
import { Confirmar } from '../ui/Hoja'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { useEnvio } from '../ui/useEnvio'
import { FormularioCliente } from './FormularioCliente'

export function DetalleCliente() {
  const { id = '' } = useParams()
  const navegar = useNavigate()
  const [editando, setEditando] = useState(false)
  const [confirmando, setConfirmando] = useState<'archivar' | 'eliminar' | null>(null)
  const { errores, enviar } = useEnvio()

  const datos = useLiveQuery(
    async () => ({
      cliente: await db.clientes.get(id),
      pedidos: await db.pedidos.where('clienteId').equals(id).count(),
    }),
    [id],
  )
  if (!datos) return null
  const { cliente, pedidos } = datos
  if (!cliente) return <Navigate to="/clientes" replace />

  const archivado = cliente.estado === 'archivado'

  return (
    <Pantalla titulo={cliente.nombre} volverA="/clientes">
      <div className="space-y-4">
        <ErrorGeneral errores={errores} />
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
        <EstadoVacio titulo="Sin pedidos" detalle="Aquí aparecerán los pedidos de este cliente y su saldo." />

        <div className="space-y-3 pt-2">
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
          {pedidos === 0 && (
            <Boton variante="peligro" onClick={() => setConfirmando('eliminar')}>
              Eliminar cliente
            </Boton>
          )}
        </div>
      </div>

      {editando && <FormularioCliente cliente={cliente} alCerrar={() => setEditando(false)} />}
      {confirmando === 'archivar' && (
        <Confirmar
          titulo={`¿Archivar a ${cliente.nombre}?`}
          mensaje="Dejará de aparecer al crear pedidos. Sus pedidos y abonos se conservan y puedes reactivarlo cuando quieras."
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
