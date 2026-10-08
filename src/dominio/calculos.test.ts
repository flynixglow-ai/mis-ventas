import { describe, expect, it } from 'vitest'
import { resumirPedido, saldoPedido, subtotalItem, totalAbonado, totalPedido } from './calculos'
import { estadoPago, estaVencido, campanaAdmiteCambios } from './estados'
import { esFechaValida, formatearFecha, hoy, mesDe, nombreMes } from './fechas'
import { formatearNumeroPedido, formatearPesos, leerPesos, normalizar } from './formato'
import { HOY, abono, escenario } from './datosDePrueba'

const productos = [
  { nombre: 'Perfume', cantidad: 1, valorUnitario: 120_000 },
  { nombre: 'Base', cantidad: 1, valorUnitario: 80_000 },
  { nombre: 'Labial', cantidad: 2, valorUnitario: 35_000 },
]

describe('cálculos del pedido', () => {
  it('calcula el subtotal de cada producto', () => {
    expect(productos.map(subtotalItem)).toEqual([120_000, 80_000, 70_000])
  })

  it('calcula el total con varios productos', () => {
    expect(totalPedido(productos)).toBe(270_000)
  })

  it('un pedido sin productos ni abonos vale 0', () => {
    expect(totalPedido([])).toBe(0)
    expect(totalAbonado([])).toBe(0)
  })

  it('saldo = total − abonos', () => {
    expect(saldoPedido([{ cantidad: 1, valorUnitario: 500_000 }], [{ valor: 100_000 }, { valor: 150_000 }])).toBe(250_000)
  })

  it('sigue el ejemplo de María: abono inicial, parcial y pago total', () => {
    const [pedido] = escenario()

    expect(resumirPedido({ ...pedido, abonos: [] }, HOY)).toMatchObject({
      total: 270_000,
      abonado: 0,
      saldo: 270_000,
      estado: 'pendiente',
    })

    expect(resumirPedido(pedido, HOY)).toMatchObject({ abonado: 100_000, saldo: 170_000, estado: 'parcial' })

    pedido.abonos.push(abono('p1', 70_000, '2026-10-15'))
    expect(resumirPedido(pedido, HOY)).toMatchObject({ abonado: 170_000, saldo: 100_000, estado: 'parcial' })

    pedido.abonos.push(abono('p1', 100_000, '2026-10-20'))
    expect(resumirPedido(pedido, HOY)).toMatchObject({ abonado: 270_000, saldo: 0, estado: 'pagado' })
  })
})

describe('estados', () => {
  it('pendiente, pago parcial y pagado', () => {
    expect(estadoPago(270_000, 0)).toBe('pendiente')
    expect(estadoPago(270_000, 1)).toBe('parcial')
    expect(estadoPago(270_000, 270_000)).toBe('pagado')
  })

  it('vencido solo si hay fecha límite pasada y saldo', () => {
    expect(estaVencido(100, '2026-10-06', HOY)).toBe(true)
    expect(estaVencido(100, HOY, HOY)).toBe(false) // el mismo día aún no vence
    expect(estaVencido(100, undefined, HOY)).toBe(false)
    expect(estaVencido(0, '2026-10-06', HOY)).toBe(false)
  })

  it('vencido no oculta cuánto se ha pagado', () => {
    const vencido = escenario()[1]
    expect(resumirPedido(vencido, HOY)).toEqual({
      total: 450_000,
      abonado: 300_000,
      saldo: 150_000,
      estado: 'parcial',
      vencido: true,
    })
  })

  it('una campaña cerrada no admite cambios', () => {
    expect(campanaAdmiteCambios({ estado: 'abierta' })).toBe(true)
    expect(campanaAdmiteCambios({ estado: 'cerrada' })).toBe(false)
  })
})

describe('formato', () => {
  it('formatea pesos con punto de miles', () => {
    expect(formatearPesos(0)).toBe('$0')
    expect(formatearPesos(999)).toBe('$999')
    expect(formatearPesos(270_000)).toBe('$270.000')
    expect(formatearPesos(3_850_000)).toBe('$3.850.000')
    expect(formatearPesos(-1_500)).toBe('-$1.500')
  })

  it('lee lo que se escribe en un campo de dinero', () => {
    expect(leerPesos('$120.000')).toBe(120_000)
    expect(leerPesos(' 120 000 ')).toBe(120_000)
    expect(leerPesos('0')).toBe(0)
    expect(leerPesos('')).toBeNull()
    expect(leerPesos('-5')).toBeNull()
    expect(leerPesos('abc')).toBeNull()
    expect(leerPesos('12,5')).toBeNull()
  })

  it('formatea el número de pedido', () => {
    expect(formatearNumeroPedido(1)).toBe('#0001')
    expect(formatearNumeroPedido(25)).toBe('#0025')
    expect(formatearNumeroPedido(12345)).toBe('#12345')
  })

  it('normaliza texto para comparar', () => {
    expect(normalizar('  ÉSIKA  ')).toBe('esika')
    expect(normalizar('Campaña   10')).toBe('campana 10')
  })
})

describe('fechas', () => {
  it('acepta solo fechas reales AAAA-MM-DD', () => {
    expect(esFechaValida('2026-10-07')).toBe(true)
    expect(esFechaValida('2028-02-29')).toBe(true)
    expect(esFechaValida('2026-02-29')).toBe(false)
    expect(esFechaValida('2026-13-01')).toBe(false)
    expect(esFechaValida('07/10/2026')).toBe(false)
    expect(esFechaValida('')).toBe(false)
    expect(esFechaValida(undefined)).toBe(false)
  })

  it('da la fecha local y la muestra en formato colombiano', () => {
    expect(hoy(new Date(2026, 9, 7, 23, 30))).toBe('2026-10-07')
    expect(formatearFecha('2026-10-07')).toBe('07/10/2026')
    expect(mesDe('2026-10-07')).toBe('2026-10')
    expect(nombreMes('2026-10')).toBe('Octubre 2026')
  })
})
