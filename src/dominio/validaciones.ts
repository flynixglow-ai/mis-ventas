import { totalPedido } from './calculos'
import { campanaAdmiteCambios } from './estados'
import { esFechaValida } from './fechas'
import { formatearPesos, normalizar } from './formato'
import { METODOS_PAGO, type Campana, type Cliente, type Id, type Marca } from './tipos'

/** Una lista vacía significa que todo es válido. */
export interface ErrorValidacion {
  campo: string
  mensaje: string
}

const error = (campo: string, mensaje: string): ErrorValidacion => ({ campo, mensaje })
const esEntero = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n)

// ---------- Marca, campaña y cliente ----------

export function validarMarca(
  marca: { nombre: string },
  existentes: readonly Pick<Marca, 'id' | 'nombre'>[],
  idPropio?: Id,
): ErrorValidacion[] {
  const nombre = normalizar(marca.nombre)
  if (!nombre) return [error('nombre', 'Escribe el nombre de la marca.')]
  if (existentes.some((m) => m.id !== idPropio && normalizar(m.nombre) === nombre)) {
    return [error('nombre', 'Ya existe una marca con ese nombre.')]
  }
  return []
}

export function validarCampana(
  campana: { marcaId: Id; nombre: string; fechaInicio?: string; fechaCierre?: string },
  existentes: readonly Pick<Campana, 'id' | 'marcaId' | 'nombre'>[],
  idPropio?: Id,
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = []
  const nombre = normalizar(campana.nombre)
  if (!campana.marcaId) errores.push(error('marcaId', 'Selecciona la marca de la campaña.'))
  if (!nombre) {
    errores.push(error('nombre', 'Escribe el nombre o número de la campaña.'))
  } else if (
    // El nombre solo debe ser único dentro de la misma marca.
    existentes.some((c) => c.id !== idPropio && c.marcaId === campana.marcaId && normalizar(c.nombre) === nombre)
  ) {
    errores.push(error('nombre', 'Esa marca ya tiene una campaña con ese nombre.'))
  }
  errores.push(...validarRango('fechaInicio', campana.fechaInicio, 'fechaCierre', campana.fechaCierre))
  return errores
}

export function validarCliente(cliente: { nombre: string }): ErrorValidacion[] {
  return normalizar(cliente.nombre) ? [] : [error('nombre', 'Escribe el nombre del cliente.')]
}

function validarRango(campoA: string, a: string | undefined, campoB: string, b: string | undefined): ErrorValidacion[] {
  const errores: ErrorValidacion[] = []
  if (a !== undefined && !esFechaValida(a)) errores.push(error(campoA, 'La fecha no es válida.'))
  if (b !== undefined && !esFechaValida(b)) errores.push(error(campoB, 'La fecha no es válida.'))
  if (errores.length === 0 && a !== undefined && b !== undefined && b < a) {
    errores.push(error(campoB, 'No puede ser anterior a la fecha inicial.'))
  }
  return errores
}

// ---------- Productos ----------

export interface BorradorItem {
  nombre: string
  cantidad: number
  valorUnitario: number
}

export function validarItem(item: BorradorItem, indice = 0): ErrorValidacion[] {
  const errores: ErrorValidacion[] = []
  const campo = (c: string) => `items.${indice}.${c}`
  if (!normalizar(item.nombre)) errores.push(error(campo('nombre'), 'Escribe el nombre del producto.'))
  if (!esEntero(item.cantidad) || item.cantidad <= 0) {
    errores.push(error(campo('cantidad'), 'La cantidad debe ser mayor que 0.'))
  }
  if (!esEntero(item.valorUnitario) || item.valorUnitario < 0) {
    errores.push(error(campo('valorUnitario'), 'El precio no puede ser negativo.'))
  }
  return errores
}

function validarItems(items: readonly BorradorItem[]): ErrorValidacion[] {
  if (items.length === 0) return [error('items', 'Agrega al menos un producto.')]
  return items.flatMap(validarItem)
}

// ---------- Abonos ----------

export interface BorradorAbono {
  valor: number
  fecha: string
  metodo: string
}

export function validarAbono(abono: BorradorAbono, saldo: number): ErrorValidacion[] {
  const errores: ErrorValidacion[] = []
  if (!esEntero(abono.valor) || abono.valor <= 0) {
    errores.push(error('valor', 'El abono debe ser mayor que $0.'))
  } else if (abono.valor > saldo) {
    errores.push(error('valor', `El abono no puede superar el saldo pendiente (${formatearPesos(saldo)}).`))
  }
  if (!esFechaValida(abono.fecha)) errores.push(error('fecha', 'La fecha no es válida.'))
  if (!(METODOS_PAGO as readonly string[]).includes(abono.metodo)) {
    errores.push(error('metodo', 'Selecciona el método de pago.'))
  }
  return errores
}

// ---------- Pedidos ----------

export interface BorradorPedido {
  clienteId: Id
  marcaId: Id
  campanaId: Id
  fecha: string
  fechaLimite?: string
  items: readonly BorradorItem[]
}

/** Lo que se sabe del cliente y la campaña elegidos, para cruzar reglas. */
export interface ContextoPedido {
  cliente?: Pick<Cliente, 'estado'>
  campana?: Pick<Campana, 'marcaId' | 'estado'>
}

export function validarPedido(pedido: BorradorPedido, contexto: ContextoPedido = {}): ErrorValidacion[] {
  const errores: ErrorValidacion[] = []
  const { cliente, campana } = contexto

  if (!pedido.clienteId) errores.push(error('clienteId', 'Selecciona un cliente.'))
  else if (cliente?.estado === 'archivado') {
    errores.push(error('clienteId', 'El cliente está archivado. Actívalo para registrarle pedidos.'))
  }

  if (!pedido.marcaId) errores.push(error('marcaId', 'Selecciona una marca.'))
  if (!pedido.campanaId) errores.push(error('campanaId', 'Selecciona una campaña.'))
  else if (campana && campana.marcaId !== pedido.marcaId) {
    errores.push(error('campanaId', 'La campaña no pertenece a la marca seleccionada.'))
  } else if (campana && !campanaAdmiteCambios(campana)) {
    errores.push(error('campanaId', 'La campaña está cerrada.'))
  }

  if (!esFechaValida(pedido.fecha)) errores.push(error('fecha', 'La fecha de venta no es válida.'))
  if (pedido.fechaLimite !== undefined) {
    if (!esFechaValida(pedido.fechaLimite)) errores.push(error('fechaLimite', 'La fecha límite no es válida.'))
    else if (esFechaValida(pedido.fecha) && pedido.fechaLimite < pedido.fecha) {
      errores.push(error('fechaLimite', 'La fecha límite no puede ser anterior a la fecha de venta.'))
    }
  }

  errores.push(...validarItems(pedido.items))
  return errores
}

/** Pedido nuevo: además puede traer un abono inicial (0 = sin abono). */
export function validarPedidoNuevo(
  pedido: BorradorPedido,
  abonoInicial: { valor: number; metodo: string },
  contexto: ContextoPedido = {},
): ErrorValidacion[] {
  const errores = validarPedido(pedido, contexto)
  if (abonoInicial.valor === 0) return errores
  const delAbono = validarAbono({ ...abonoInicial, fecha: pedido.fecha }, totalPedido(pedido.items))
    // La fecha del abono inicial es la de la venta: ese error ya se reporta arriba.
    .filter((e) => e.campo !== 'fecha')
    .map((e) => ({ ...e, campo: `abonoInicial.${e.campo}` }))
  return [...errores, ...delAbono]
}

/**
 * Editar un pedido que ya tiene abonos: el total puede subir, pero nunca
 * quedar por debajo de lo que ya se abonó.
 */
export function validarPedidoEditado(
  pedido: BorradorPedido,
  abonado: number,
  contexto: ContextoPedido = {},
): ErrorValidacion[] {
  const errores = validarPedido(pedido, contexto)
  const total = totalPedido(pedido.items)
  if (total < abonado) {
    errores.push(
      error(
        'items',
        `El total (${formatearPesos(total)}) no puede ser menor que lo ya abonado (${formatearPesos(abonado)}).`,
      ),
    )
  }
  return errores
}
