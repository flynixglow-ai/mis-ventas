import type { Campana, Fecha } from './tipos'

export type EstadoPago = 'pendiente' | 'parcial' | 'pagado'

export const ETIQUETA_ESTADO: Record<EstadoPago, string> = {
  pendiente: 'Pendiente',
  parcial: 'Pago parcial',
  pagado: 'Pagado',
}

/** El estado nunca se guarda: sale del total y de lo abonado. */
export function estadoPago(total: number, abonado: number): EstadoPago {
  if (total - abonado <= 0) return 'pagado'
  return abonado > 0 ? 'parcial' : 'pendiente'
}

/**
 * "Vencido" es una marca adicional al estado de pago, no lo reemplaza:
 * un pedido vencido sigue siendo pendiente o de pago parcial.
 * El día de la fecha límite todavía no está vencido.
 */
export function estaVencido(saldo: number, fechaLimite: Fecha | undefined, hoy: Fecha): boolean {
  return saldo > 0 && fechaLimite !== undefined && hoy > fechaLimite
}

/** Preparado para el cierre de campañas: una campaña cerrada no admite cambios. */
export function campanaAdmiteCambios(campana: Pick<Campana, 'estado'>): boolean {
  return campana.estado === 'abierta'
}
