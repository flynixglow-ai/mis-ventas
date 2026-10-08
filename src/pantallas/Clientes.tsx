import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { coincideCliente } from '../dominio/busqueda'
import type { EstadoCliente } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { EstadoVacio, Fila, Lista, Pantalla } from '../ui/Pantalla'
import { IconoBuscar } from '../ui/iconos'
import { FormularioCliente } from './FormularioCliente'

export function Clientes() {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<EstadoCliente>('activo')
  const [creando, setCreando] = useState(false)
  const todos = useLiveQuery(() => db.clientes.orderBy('nombre').toArray(), [])

  const archivados = todos?.filter((c) => c.estado === 'archivado').length ?? 0
  // Si se reactiva el último archivado, la vista vuelve sola a los activos.
  const viendo = archivados === 0 ? 'activo' : estado
  const visibles = todos
    ?.filter((c) => c.estado === viendo && coincideCliente(c, texto))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <Pantalla
      titulo="Clientes"
      accion={
        <Boton variante="compacto" onClick={() => setCreando(true)}>
          Nuevo
        </Boton>
      }
    >
      {todos && todos.length > 0 && (
        <label className="relative mb-4 block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tenue">
            <IconoBuscar />
          </span>
          <input
            type="search"
            aria-label="Buscar cliente"
            placeholder="Buscar cliente"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="h-12 w-full rounded-2xl border border-borde bg-superficie pl-11 pr-4 outline-none placeholder:text-tenue/60 focus:border-acento"
          />
        </label>
      )}
      {archivados > 0 && (
        <div role="tablist" className="mb-4 grid grid-cols-2 rounded-2xl bg-superficie p-1 text-sm font-semibold">
          {(['activo', 'archivado'] as const).map((e) => (
            <button
              key={e}
              role="tab"
              aria-selected={viendo === e}
              onClick={() => setEstado(e)}
              className={`h-10 rounded-xl transition-colors ${viendo === e ? 'bg-superficie-2 text-texto' : 'text-tenue'}`}
            >
              {e === 'activo' ? 'Activos' : `Archivados (${archivados})`}
            </button>
          ))}
        </div>
      )}
      {todos?.length === 0 && (
        <EstadoVacio titulo="Sin clientes" detalle="Agrega a las personas que te compran." />
      )}
      {todos && todos.length > 0 && visibles?.length === 0 && (
        <EstadoVacio
          titulo="Sin resultados"
          detalle={texto ? `Nadie coincide con "${texto}".` : 'No hay clientes en esta lista.'}
        />
      )}
      {visibles && visibles.length > 0 && (
        <Lista etiqueta="Clientes">
          {visibles.map((c) => (
            <Fila key={c.id} titulo={c.nombre} detalle={c.telefono || 'Sin teléfono'} a={`/clientes/${c.id}`} inicial />
          ))}
        </Lista>
      )}
      {creando && <FormularioCliente alCerrar={() => setCreando(false)} />}
    </Pantalla>
  )
}
