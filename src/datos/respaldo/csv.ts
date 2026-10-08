import { resumirPedido, subtotalItem } from '../../dominio/calculos'
import { ETIQUETA_ESTADO } from '../../dominio/estados'
import { ordenarAbonos } from '../../dominio/historial'
import { ETIQUETA_METODO, type Fecha, type PedidoVista } from '../../dominio/tipos'

type Celda = string | number

// Punto y coma + BOM: así Excel en español abre el archivo con columnas y tildes correctas.
const SEPARADOR = ';'
const BOM = '﻿'

function celda(valor: Celda): string {
  const t = String(valor)
  return /[";\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

function csv(encabezado: string[], filas: Celda[][]): string {
  return BOM + [encabezado, ...filas].map((fila) => fila.map(celda).join(SEPARADOR)).join('\r\n') + '\r\n'
}

export interface ArchivoCsv {
  nombre: string
  contenido: string
}

/** Tres archivos: un pedido por fila, un producto por fila y un abono por fila. */
export function generarCsv(vistas: readonly PedidoVista[], hoy: Fecha): ArchivoCsv[] {
  const pedidos = [...vistas].sort((a, b) => a.pedido.numero - b.pedido.numero)
  const comun = (v: PedidoVista): Celda[] => [v.pedido.numero, v.cliente.nombre, v.marca.nombre, v.campana.nombre]

  return [
    {
      nombre: `mis-ventas-pedidos-${hoy}.csv`,
      contenido: csv(
        ['Pedido', 'Cliente', 'Marca', 'Campaña', 'Teléfono', 'Fecha', 'Fecha límite', 'Total', 'Abonado', 'Saldo', 'Estado', 'Vencido', 'Notas'],
        pedidos.map((v) => {
          const r = resumirPedido(v, hoy)
          return [
            ...comun(v),
            v.cliente.telefono,
            v.pedido.fecha,
            v.pedido.fechaLimite ?? '',
            r.total,
            r.abonado,
            r.saldo,
            ETIQUETA_ESTADO[r.estado],
            r.vencido ? 'Sí' : 'No',
            v.pedido.notas,
          ]
        }),
      ),
    },
    {
      nombre: `mis-ventas-productos-${hoy}.csv`,
      contenido: csv(
        ['Pedido', 'Cliente', 'Marca', 'Campaña', 'Fecha', 'Producto', 'Cantidad', 'Valor unitario', 'Subtotal'],
        pedidos.flatMap((v) =>
          v.items.map((i) => [...comun(v), v.pedido.fecha, i.nombre, i.cantidad, i.valorUnitario, subtotalItem(i)]),
        ),
      ),
    },
    {
      nombre: `mis-ventas-abonos-${hoy}.csv`,
      contenido: csv(
        ['Pedido', 'Cliente', 'Marca', 'Campaña', 'Fecha', 'Valor', 'Método', 'Nota'],
        pedidos.flatMap((v) =>
          ordenarAbonos(v.abonos).map((a) => [...comun(v), a.fecha, a.valor, ETIQUETA_METODO[a.metodo], a.nota ?? '']),
        ),
      ),
    },
  ]
}
