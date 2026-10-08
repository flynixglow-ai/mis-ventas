// Entidades del negocio. El dinero va en enteros (pesos) y las fechas de
// negocio en texto AAAA-MM-DD. Total, saldo y estado del pedido NO son campos:
// siempre se calculan.

export type Id = string
/** Fecha de negocio, AAAA-MM-DD. */
export type Fecha = string
/** Marca de tiempo ISO completa. */
export type FechaHora = string

export interface Marca {
  id: Id
  nombre: string
  activa: boolean
  creadaEn: FechaHora
}

export type EstadoCampana = 'abierta' | 'cerrada'

export interface Campana {
  id: Id
  marcaId: Id
  nombre: string
  fechaInicio?: Fecha
  fechaCierre?: Fecha
  estado: EstadoCampana
  notas?: string
  creadaEn: FechaHora
}

export type EstadoCliente = 'activo' | 'archivado'

export interface Cliente {
  id: Id
  nombre: string
  telefono: string
  notas: string
  estado: EstadoCliente
  creadoEn: FechaHora
}

export interface Pedido {
  id: Id
  /** Consecutivo global; nunca se reutiliza. */
  numero: number
  clienteId: Id
  marcaId: Id
  campanaId: Id
  fecha: Fecha
  fechaLimite?: Fecha
  notas: string
  creadoEn: FechaHora
}

export interface Item {
  id: Id
  pedidoId: Id
  nombre: string
  cantidad: number
  valorUnitario: number
  /** Reservado para el catálogo de productos (futuro). */
  productoId?: Id
  /** Reservado para costos y ganancias (futuro). */
  costoUnitario?: number
}

export const METODOS_PAGO = ['efectivo', 'nequi', 'transferencia', 'otro'] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]

export interface Abono {
  id: Id
  pedidoId: Id
  valor: number
  fecha: Fecha
  metodo: MetodoPago
  nota?: string
  creadoEn: FechaHora
}

/** Un pedido con sus productos y abonos: lo mínimo para calcular. */
export interface PedidoDetallado {
  pedido: Pedido
  items: Item[]
  abonos: Abono[]
}

/** Un pedido con todo lo necesario para mostrarlo y buscarlo. */
export interface PedidoVista extends PedidoDetallado {
  cliente: Cliente
  marca: Marca
  campana: Campana
}

export interface Meta {
  clave: string
  valor: string | number
}
