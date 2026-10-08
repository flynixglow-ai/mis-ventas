import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVistas } from '../datos/repositorios/consultas'
import { ETIQUETA_FILTRO, filtrarPedidos, type FiltroEstado, type FiltrosPedidos } from '../dominio/busqueda'
import { hoy } from '../dominio/fechas'
import { contar, formatearPesos } from '../dominio/formato'
import { calcularTotales } from '../dominio/reportes'
import { Boton } from '../ui/Boton'
import { Campo, claseEntrada } from '../ui/Campo'
import { Hoja } from '../ui/Hoja'
import { EstadoVacio, Pantalla } from '../ui/Pantalla'
import { TarjetaPedido } from '../ui/Pedido'
import { IconoBuscar } from '../ui/iconos'

const ESTADOS = Object.keys(ETIQUETA_FILTRO) as FiltroEstado[]
// Los filtros viven en la dirección: se conservan al abrir un pedido y volver.
const CLAVES = { texto: 'q', estado: 'estado', marcaId: 'marca', campanaId: 'campana', clienteId: 'cliente', desde: 'desde', hasta: 'hasta' } as const
type Clave = keyof typeof CLAVES

export function Pedidos() {
  const [parametros, setParametros] = useSearchParams()
  const [filtrando, setFiltrando] = useState(false)
  const vistas = useLiveQuery(() => cargarVistas(), [])
  const catalogo = useLiveQuery(async () => {
    const [marcas, campanas, clientes] = await Promise.all([db.marcas.toArray(), db.campanas.toArray(), db.clientes.toArray()])
    const porNombre = (a: { nombre: string }, b: { nombre: string }) => a.nombre.localeCompare(b.nombre, 'es', { numeric: true })
    return { marcas: marcas.sort(porNombre), campanas: campanas.sort((a, b) => porNombre(b, a)), clientes: clientes.sort(porNombre) }
  }, [])

  const leer = (clave: Clave) => parametros.get(CLAVES[clave]) ?? ''
  const estado = (ESTADOS.includes(leer('estado') as FiltroEstado) ? leer('estado') : 'todas') as FiltroEstado
  const filtros: FiltrosPedidos = {
    estado,
    texto: leer('texto'),
    marcaId: leer('marcaId') || undefined,
    campanaId: leer('campanaId') || undefined,
    clienteId: leer('clienteId') || undefined,
    desde: leer('desde') || undefined,
    hasta: leer('hasta') || undefined,
  }

  function cambiar(cambios: Partial<Record<Clave, string>>) {
    const nuevos = new URLSearchParams(parametros)
    for (const [clave, valor] of Object.entries(cambios) as [Clave, string][]) {
      if (valor && valor !== 'todas') nuevos.set(CLAVES[clave], valor)
      else nuevos.delete(CLAVES[clave])
    }
    setParametros(nuevos, { replace: true })
  }

  const fecha = hoy()
  const pedidos = vistas && filtrarPedidos(vistas, filtros, fecha)
  const totales = calcularTotales(pedidos ?? [])

  const marca = catalogo?.marcas.find((m) => m.id === filtros.marcaId)
  const campana = catalogo?.campanas.find((c) => c.id === filtros.campanaId)
  const cliente = catalogo?.clientes.find((c) => c.id === filtros.clienteId)
  const activos = [
    marca?.nombre,
    campana?.nombre,
    cliente?.nombre,
    filtros.desde && `Desde ${filtros.desde.split('-').reverse().join('/')}`,
    filtros.hasta && `Hasta ${filtros.hasta.split('-').reverse().join('/')}`,
  ].filter(Boolean) as string[]
  const limpiar = () => cambiar({ marcaId: '', campanaId: '', clienteId: '', desde: '', hasta: '' })

  return (
    <Pantalla
      titulo="Pedidos"
      accion={
        vistas &&
        vistas.length > 0 && (
          <Boton variante="compacto" onClick={() => setFiltrando(true)}>
            Filtros{activos.length > 0 && ` (${activos.length})`}
          </Boton>
        )
      }
    >
      {vistas?.length === 0 && <EstadoVacio titulo="Sin pedidos" detalle="Toca ＋ para registrar tu primera venta." />}

      {vistas && vistas.length > 0 && (
        <>
          <label className="relative mb-3 block">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-tenue">
              <IconoBuscar />
            </span>
            <input
              type="search"
              aria-label="Buscar pedidos"
              placeholder="Cliente, producto o #número"
              value={filtros.texto}
              onChange={(e) => cambiar({ texto: e.target.value })}
              className="h-12 w-full rounded-2xl border border-borde bg-superficie pl-11 pr-4 outline-none placeholder:text-tenue/60 focus:border-acento"
            />
          </label>

          <div role="group" aria-label="Estado" className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
            {ESTADOS.map((e) => (
              <button
                key={e}
                type="button"
                aria-pressed={estado === e}
                onClick={() => cambiar({ estado: e })}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                  estado === e ? 'border-acento bg-acento text-white' : 'border-borde bg-superficie text-tenue'
                }`}
              >
                {ETIQUETA_FILTRO[e]}
              </button>
            ))}
          </div>

          {activos.length > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-2xl bg-acento/10 px-4 py-2.5 text-sm">
              <span aria-label="Filtros activos" className="min-w-0 flex-1 truncate font-medium text-acento">
                {activos.join(' · ')}
              </span>
              <button type="button" onClick={limpiar} className="shrink-0 font-semibold text-tenue">
                Quitar
              </button>
            </div>
          )}

          <dl aria-label="Resumen de la lista" className="mb-4 grid grid-cols-3 rounded-2xl border border-borde bg-superficie py-3 text-center">
            <div>
              <dt className="text-xs text-tenue">{totales.pedidos === 1 ? 'Pedido' : 'Pedidos'}</dt>
              <dd className="font-bold">{totales.pedidos}</dd>
            </div>
            <div>
              <dt className="text-xs text-tenue">Vendido</dt>
              <dd className="font-bold">{formatearPesos(totales.vendido)}</dd>
            </div>
            <div>
              <dt className="text-xs text-tenue">Pendiente</dt>
              <dd className={`font-bold ${totales.pendiente > 0 ? 'text-aviso' : ''}`}>{formatearPesos(totales.pendiente)}</dd>
            </div>
          </dl>

          {pedidos?.length === 0 ? (
            <EstadoVacio titulo="Sin resultados" detalle="Ningún pedido coincide con la búsqueda y los filtros." />
          ) : (
            <ul aria-label="Pedidos" className="space-y-3">
              {pedidos?.map((v) => (
                <TarjetaPedido key={v.pedido.id} vista={v} hoy={fecha} />
              ))}
            </ul>
          )}
        </>
      )}

      {filtrando && catalogo && (
        <Hoja titulo="Filtros" alCerrar={() => setFiltrando(false)}>
          <div className="space-y-4">
            <Campo etiqueta="Marca">
              <select
                aria-label="Marca"
                className={claseEntrada}
                value={filtros.marcaId ?? ''}
                // Al cambiar de marca se suelta la campaña: cada campaña es de una sola marca.
                onChange={(e) => cambiar({ marcaId: e.target.value, campanaId: '' })}
              >
                <option value="">Todas las marcas</option>
                {catalogo.marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Campaña">
              <select
                aria-label="Campaña"
                className={claseEntrada}
                value={filtros.campanaId ?? ''}
                disabled={!filtros.marcaId}
                onChange={(e) => cambiar({ campanaId: e.target.value })}
              >
                <option value="">{filtros.marcaId ? 'Todas las campañas' : 'Elige primero una marca'}</option>
                {catalogo.campanas
                  .filter((c) => c.marcaId === filtros.marcaId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
              </select>
            </Campo>
            <Campo etiqueta="Cliente">
              <select aria-label="Cliente" className={claseEntrada} value={filtros.clienteId ?? ''} onChange={(e) => cambiar({ clienteId: e.target.value })}>
                <option value="">Todos los clientes</option>
                {catalogo.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <div className="grid grid-cols-2 gap-3">
              <Campo etiqueta="Desde">
                <input type="date" className={claseEntrada} value={filtros.desde ?? ''} onChange={(e) => cambiar({ desde: e.target.value })} />
              </Campo>
              <Campo etiqueta="Hasta">
                <input type="date" className={claseEntrada} value={filtros.hasta ?? ''} onChange={(e) => cambiar({ hasta: e.target.value })} />
              </Campo>
            </div>
            <Boton onClick={() => setFiltrando(false)}>Ver {contar(totales.pedidos, 'pedido', 'pedidos')}</Boton>
            {activos.length > 0 && (
              <Boton variante="secundario" onClick={limpiar}>
                Quitar filtros
              </Boton>
            )}
          </div>
        </Hoja>
      )}
    </Pantalla>
  )
}
