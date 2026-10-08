import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVista } from '../datos/repositorios/consultas'
import { crearPedido, editarPedido } from '../datos/repositorios/pedidos'
import { coincideCliente } from '../dominio/busqueda'
import { subtotalItem, totalAbonado, totalPedido } from '../dominio/calculos'
import { hoy } from '../dominio/fechas'
import { formatearNumeroPedido, formatearPesos } from '../dominio/formato'
import type { Campana, Cliente, Marca, Pedido } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { Campo, claseArea, claseEntrada, mensajeDe } from '../ui/Campo'
import { Confirmar, Hoja } from '../ui/Hoja'
import { EstadoVacio, Fila as FilaLista, Lista, Pantalla } from '../ui/Pantalla'
import { EntradaDinero, SelectorMetodo } from '../ui/Pedido'
import { IconoAdelante, IconoCerrar } from '../ui/iconos'
import { useEnvio } from '../ui/useEnvio'
import { useVolver } from '../ui/useVolver'
import { FormularioCliente } from './FormularioCliente'

interface FilaProducto {
  clave: number
  nombre: string
  cantidad: number
  valorUnitario: number
}

interface Inicial {
  clienteId: string
  marcaId: string
  campanaId: string
  fecha: string
  fechaLimite: string
  notas: string
  items: FilaProducto[]
}

const porNombre = (a: { nombre: string }, b: { nombre: string }) => a.nombre.localeCompare(b.nombre, 'es')
// Orden numérico descendente: la campaña más reciente primero.
const masReciente = (a: Campana, b: Campana) => b.nombre.localeCompare(a.nombre, 'es', { numeric: true })

function useCatalogo() {
  return useLiveQuery(async () => {
    const [marcas, campanas, clientes] = await Promise.all([db.marcas.toArray(), db.campanas.toArray(), db.clientes.toArray()])
    return { marcas: marcas.sort(porNombre), campanas: campanas.sort(masReciente), clientes: clientes.sort(porNombre) }
  }, [])
}

export function NuevoPedido() {
  const [parametros] = useSearchParams()
  const catalogo = useCatalogo()
  // Se propone la marca y campaña del último pedido: lo normal es seguir vendiendo en la misma.
  const ultimo = useLiveQuery(async () => (await db.pedidos.orderBy('numero').last()) ?? null, [])
  if (!catalogo || ultimo === undefined) return null

  const marcas = catalogo.marcas.filter((m) => m.activa)
  const campanas = catalogo.campanas.filter((c) => c.estado === 'abierta' && marcas.some((m) => m.id === c.marcaId))
  if (campanas.length === 0) {
    return (
      <div className="h-full overflow-y-auto">
        <Pantalla titulo="Nuevo pedido" volverA="/">
          <EstadoVacio
            titulo="Falta un paso"
            detalle="Para registrar un pedido necesitas al menos una marca activa con una campaña."
          >
            <Link to={marcas.length === 0 ? '/mas/marcas' : '/mas/campanas'} className="font-semibold text-acento">
              {marcas.length === 0 ? 'Crear una marca' : 'Crear una campaña'}
            </Link>
          </EstadoVacio>
        </Pantalla>
      </div>
    )
  }

  const sugerida = campanas.find((c) => c.id === ultimo?.campanaId) ?? (marcas.length === 1 ? campanas[0] : undefined)
  const cliente = catalogo.clientes.find((c) => c.id === parametros.get('cliente') && c.estado === 'activo')
  return (
    <FormularioPedido
      {...catalogo}
      abonado={0}
      inicial={{
        clienteId: cliente?.id ?? '',
        marcaId: sugerida?.marcaId ?? '',
        campanaId: sugerida?.id ?? '',
        fecha: hoy(),
        fechaLimite: '',
        notas: '',
        items: [{ clave: 0, nombre: '', cantidad: 1, valorUnitario: 0 }],
      }}
    />
  )
}

export function EditarPedido() {
  const { id = '' } = useParams()
  const catalogo = useCatalogo()
  // Se lee una sola vez: mientras se edita, el formulario es la fuente de verdad.
  const vista = useLiveQuery(async () => (await cargarVista(id)) ?? null, [id])
  if (!catalogo || vista === undefined) return null
  if (vista === null) return <Navigate to="/pedidos" replace />
  return (
    <FormularioPedido
      key={id}
      {...catalogo}
      pedido={vista.pedido}
      abonado={totalAbonado(vista.abonos)}
      inicial={{
        clienteId: vista.pedido.clienteId,
        marcaId: vista.pedido.marcaId,
        campanaId: vista.pedido.campanaId,
        fecha: vista.pedido.fecha,
        fechaLimite: vista.pedido.fechaLimite ?? '',
        notas: vista.pedido.notas,
        items: vista.items.map((i, clave) => ({ clave, nombre: i.nombre, cantidad: i.cantidad, valorUnitario: i.valorUnitario })),
      }}
    />
  )
}

interface Props {
  pedido?: Pedido
  abonado: number
  inicial: Inicial
  marcas: Marca[]
  campanas: Campana[]
  clientes: Cliente[]
}

function FormularioPedido({ pedido, abonado, inicial, marcas, campanas, clientes }: Props) {
  const navegar = useNavigate()
  const volver = useVolver('/pedidos')
  const { errores, enviando, enviar } = useEnvio()
  const siguienteClave = useRef(inicial.items.length)

  const [clienteId, setClienteId] = useState(inicial.clienteId)
  const [marcaId, setMarcaId] = useState(inicial.marcaId)
  const [campanaId, setCampanaId] = useState(inicial.campanaId)
  const [items, setItems] = useState(inicial.items)
  const [abono, setAbono] = useState(0)
  const [metodo, setMetodo] = useState('efectivo')
  const [fecha, setFecha] = useState(inicial.fecha)
  const [fechaLimite, setFechaLimite] = useState(inicial.fechaLimite)
  const [notas, setNotas] = useState(inicial.notas)
  const [eligiendoCliente, setEligiendoCliente] = useState(false)
  const [porQuitar, setPorQuitar] = useState<FilaProducto | null>(null)

  const cliente = clientes.find((c) => c.id === clienteId)
  // Al editar se conservan como opción la marca y la campaña originales aunque ya no estén activas.
  const marcasElegibles = marcas.filter((m) => m.activa || m.id === inicial.marcaId)
  const campanasDe = (marca: string) =>
    campanas.filter((c) => c.marcaId === marca && (c.estado === 'abierta' || c.id === inicial.campanaId))

  const total = totalPedido(items)
  const pagado = pedido ? abonado : abono
  const saldo = total - pagado

  function cambiarMarca(nueva: string) {
    setMarcaId(nueva)
    // Solo se ofrecen campañas de la marca elegida; se propone la más reciente.
    setCampanaId(campanasDe(nueva)[0]?.id ?? '')
  }

  const cambiarItem = (clave: number, cambios: Partial<FilaProducto>) =>
    setItems((lista) => lista.map((i) => (i.clave === clave ? { ...i, ...cambios } : i)))
  const agregarItem = () =>
    setItems((lista) => [...lista, { clave: siguienteClave.current++, nombre: '', cantidad: 1, valorUnitario: 0 }])
  const quitarItem = (clave: number) => setItems((lista) => lista.filter((i) => i.clave !== clave))

  async function guardar() {
    const datos = { clienteId, marcaId, campanaId, fecha, fechaLimite, notas, items }
    if (pedido) {
      await editarPedido(pedido.id, datos)
      volver()
    } else {
      const creado = await crearPedido(datos, { valor: abono, metodo })
      navegar(`/pedidos/${creado.id}`, { replace: true })
    }
  }

  const primerError = errores[0]?.mensaje

  return (
    <form className="flex h-full flex-col" onSubmit={(e) => enviar(guardar, e)} noValidate>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <Pantalla titulo={pedido ? `Editar ${formatearNumeroPedido(pedido.numero)}` : 'Nuevo pedido'} volverA="/pedidos">
          <div className="space-y-6">
            <section className="space-y-4">
              <Campo etiqueta="Cliente" error={mensajeDe(errores, 'clienteId')}>
                <button
                  type="button"
                  aria-label={`Cliente: ${cliente?.nombre ?? 'Seleccionar cliente'}`}
                  onClick={() => setEligiendoCliente(true)}
                  className={`${claseEntrada} flex items-center justify-between text-left`}
                >
                  <span className={cliente ? '' : 'text-tenue/60'}>{cliente?.nombre ?? 'Seleccionar cliente'}</span>
                  <span className="text-tenue">
                    <IconoAdelante />
                  </span>
                </button>
              </Campo>
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Marca" error={mensajeDe(errores, 'marcaId')}>
                  <select aria-label="Marca" className={claseEntrada} value={marcaId} onChange={(e) => cambiarMarca(e.target.value)}>
                    <option value="">Elegir</option>
                    {marcasElegibles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo etiqueta="Campaña" error={mensajeDe(errores, 'campanaId')}>
                  <select
                    aria-label="Campaña"
                    className={claseEntrada}
                    value={campanaId}
                    disabled={!marcaId}
                    onChange={(e) => setCampanaId(e.target.value)}
                  >
                    <option value="">{marcaId ? 'Elegir' : '—'}</option>
                    {campanasDe(marcaId).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </section>

            <section aria-label="Productos">
              <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-tenue">Productos</h2>
              <ul className="space-y-3">
                {items.map((item, i) => (
                  <li key={item.clave} aria-label={`Producto ${i + 1}`} className="rounded-tarjeta border border-borde bg-superficie p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <input
                          aria-label="Nombre del producto"
                          className={claseEntrada.replace('mt-1.5 ', '')}
                          placeholder="Nombre del producto"
                          value={item.nombre}
                          autoComplete="off"
                          autoCapitalize="sentences"
                          onChange={(e) => cambiarItem(item.clave, { nombre: e.target.value })}
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          aria-label="Quitar producto"
                          onClick={() => (item.nombre.trim() || item.valorUnitario ? setPorQuitar(item) : quitarItem(item.clave))}
                          className="flex h-13 w-11 shrink-0 items-center justify-center rounded-2xl text-tenue active:bg-superficie-2"
                        >
                          <IconoCerrar />
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-[5.5rem_1fr] gap-3">
                      <Campo etiqueta="Cantidad">
                        <input
                          inputMode="numeric"
                          className={`${claseEntrada} text-center`}
                          value={item.cantidad || ''}
                          onChange={(e) => cambiarItem(item.clave, { cantidad: Number(e.target.value.replace(/\D/g, '').slice(0, 4)) })}
                        />
                      </Campo>
                      <Campo etiqueta="Valor unitario">
                        <EntradaDinero valor={item.valorUnitario} alCambiar={(valorUnitario) => cambiarItem(item.clave, { valorUnitario })} />
                      </Campo>
                    </div>
                    {(['nombre', 'cantidad', 'valorUnitario'] as const).map((campo) => {
                      const mensaje = mensajeDe(errores, `items.${i}.${campo}`)
                      return (
                        mensaje && (
                          <p key={campo} role="alert" className="mt-2 text-sm text-peligro">
                            {mensaje}
                          </p>
                        )
                      )
                    })}
                    <p className="mt-3 flex justify-between text-sm">
                      <span className="text-tenue">Subtotal</span>
                      <span className="font-semibold">{formatearPesos(subtotalItem(item))}</span>
                    </p>
                  </li>
                ))}
              </ul>
              <Boton variante="secundario" className="mt-3" onClick={agregarItem}>
                + Agregar producto
              </Boton>
            </section>

            {!pedido && (
              <section className="space-y-4">
                <Campo etiqueta="Abono inicial" opcional error={mensajeDe(errores, 'abonoInicial.valor')}>
                  <EntradaDinero valor={abono} alCambiar={setAbono} />
                </Campo>
                {abono > 0 && (
                  <div>
                    <span className="text-sm font-medium text-tenue">Método de pago</span>
                    <SelectorMetodo valor={metodo} alCambiar={setMetodo} />
                  </div>
                )}
              </section>
            )}

            <section className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Campo etiqueta="Fecha de venta" error={mensajeDe(errores, 'fecha')}>
                  <input type="date" className={claseEntrada} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </Campo>
                <Campo etiqueta="Fecha límite" opcional error={mensajeDe(errores, 'fechaLimite')}>
                  <input type="date" className={claseEntrada} value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
                </Campo>
              </div>
              <Campo etiqueta="Notas" opcional>
                <textarea className={claseArea} value={notas} onChange={(e) => setNotas(e.target.value)} />
              </Campo>
            </section>
          </div>
        </Pantalla>
      </div>

      <footer className="border-t border-borde bg-superficie px-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        <dl aria-label="Resumen" className="mb-3 grid grid-cols-3 text-center">
          <div>
            <dt className="text-xs text-tenue">Total</dt>
            <dd className="font-bold">{formatearPesos(total)}</dd>
          </div>
          <div>
            <dt className="text-xs text-tenue">{pedido ? 'Abonado' : 'Abono'}</dt>
            <dd className="font-bold">{formatearPesos(pagado)}</dd>
          </div>
          <div>
            <dt className="text-xs text-tenue">Saldo</dt>
            <dd className={`font-bold ${saldo < 0 ? 'text-peligro' : saldo > 0 ? 'text-aviso' : 'text-exito'}`}>
              {formatearPesos(saldo)}
            </dd>
          </div>
        </dl>
        {primerError && (
          <p role="alert" className="mb-3 rounded-2xl border border-peligro/40 bg-peligro/10 px-4 py-2.5 text-sm text-peligro">
            {primerError}
          </p>
        )}
        <Boton type="submit" disabled={enviando}>
          {pedido ? 'Guardar cambios' : 'Guardar pedido'}
        </Boton>
      </footer>

      {eligiendoCliente && (
        <SelectorCliente
          clientes={clientes.filter((c) => c.estado === 'activo')}
          alElegir={(id) => {
            setClienteId(id)
            setEligiendoCliente(false)
          }}
          alCerrar={() => setEligiendoCliente(false)}
        />
      )}
      {porQuitar && (
        <Confirmar
          titulo="¿Quitar producto?"
          mensaje={`Se quitará "${porQuitar.nombre.trim() || 'Producto sin nombre'}" de este pedido.`}
          textoConfirmar="Quitar"
          peligro
          alCancelar={() => setPorQuitar(null)}
          alConfirmar={() => {
            quitarItem(porQuitar.clave)
            setPorQuitar(null)
          }}
        />
      )}
    </form>
  )
}

function SelectorCliente({
  clientes,
  alElegir,
  alCerrar,
}: {
  clientes: Cliente[]
  alElegir: (id: string) => void
  alCerrar: () => void
}) {
  const [texto, setTexto] = useState('')
  const [creando, setCreando] = useState(false)
  const visibles = clientes.filter((c) => coincideCliente(c, texto))

  if (creando) {
    return <FormularioCliente nombreInicial={texto.trim()} alCerrar={() => setCreando(false)} alCrear={(c) => alElegir(c.id)} />
  }
  return (
    <Hoja titulo="Seleccionar cliente" alCerrar={alCerrar}>
      <div className="space-y-4">
        <input
          type="search"
          aria-label="Buscar cliente"
          placeholder="Buscar cliente"
          className={claseEntrada.replace('mt-1.5 ', '')}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Boton variante="secundario" onClick={() => setCreando(true)}>
          + Crear cliente{texto.trim() && ` "${texto.trim()}"`}
        </Boton>
        {visibles.length > 0 && (
          <Lista etiqueta="Clientes">
            {visibles.map((c) => (
              <FilaLista key={c.id} titulo={c.nombre} detalle={c.telefono || undefined} alTocar={() => alElegir(c.id)} inicial />
            ))}
          </Lista>
        )}
        {visibles.length === 0 && clientes.length > 0 && <p className="text-center text-sm text-tenue">Nadie coincide con la búsqueda.</p>}
      </div>
    </Hoja>
  )
}
