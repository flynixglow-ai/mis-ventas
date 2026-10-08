import { describe, expect, it } from 'vitest'
import { agrupar, calcularTotales, mayoresSaldos, pendientesRecientes, reporteDelMes, reportePorMes } from './reportes'
import { construirHistorial } from './historial'
import { abono, carlos, escenario, maria, numeros, vista, esika, esika10 } from './datosDePrueba'

describe('totales', () => {
  it('de todo el negocio', () => {
    expect(calcularTotales(escenario())).toEqual({
      vendido: 850_000,
      cobrado: 490_000,
      pendiente: 360_000,
      pedidos: 4,
      pedidosPendientes: 3,
      pedidosPagados: 1,
      clientes: 2,
      clientesConSaldo: 2,
    })
  })

  it('sin pedidos todo es 0', () => {
    expect(calcularTotales([])).toMatchObject({ vendido: 0, cobrado: 0, pendiente: 0, pedidos: 0, clientes: 0 })
  })

  it('por marca', () => {
    const porMarca = agrupar(escenario(), (d) => d.pedido.marcaId)
    expect(porMarca.get('esika')).toMatchObject({ vendido: 360_000, cobrado: 190_000, pendiente: 170_000 })
    expect(porMarca.get('novaventa')).toMatchObject({ vendido: 490_000, cobrado: 300_000, pendiente: 190_000 })
  })

  it('por campaña, sin mezclar "Campaña 10" de marcas distintas', () => {
    const porCampana = agrupar(escenario(), (d) => d.pedido.campanaId)
    expect(porCampana.get('e10')).toEqual({
      vendido: 360_000,
      cobrado: 190_000,
      pendiente: 170_000,
      pedidos: 2,
      pedidosPendientes: 1,
      pedidosPagados: 1,
      clientes: 2,
      clientesConSaldo: 1,
    })
    expect(porCampana.get('n10')).toMatchObject({ vendido: 40_000, cobrado: 0, pendiente: 40_000, pedidos: 1 })
    expect(porCampana.get('n5')).toMatchObject({ vendido: 450_000, pendiente: 150_000 })
  })

  it('por cliente: comprado, pagado y saldo con varios pedidos', () => {
    const porCliente = agrupar(escenario(), (d) => d.pedido.clienteId)
    expect(porCliente.get(maria.id)).toMatchObject({ vendido: 720_000, cobrado: 400_000, pendiente: 320_000, pedidos: 2 })
    expect(porCliente.get(carlos.id)).toMatchObject({ vendido: 130_000, cobrado: 90_000, pendiente: 40_000 })
  })

  it('por mes: vendido por fecha de venta y cobrado por fecha de abono', () => {
    expect(reportePorMes(escenario())).toEqual([
      { mes: '2026-10', vendido: 400_000, cobrado: 190_000, pendiente: 210_000 },
      { mes: '2026-09', vendido: 450_000, cobrado: 300_000, pendiente: 150_000 },
    ])
  })

  it('un abono recibido en otro mes cuenta en el mes en que se recibió', () => {
    const pedidos = escenario()
    pedidos[1].abonos.push(abono('p2', 50_000, '2026-10-03'))
    expect(reporteDelMes(pedidos, '2026-10')).toMatchObject({ cobrado: 240_000 })
    expect(reporteDelMes(pedidos, '2026-09')).toMatchObject({ cobrado: 300_000, pendiente: 100_000 })
    expect(reporteDelMes(pedidos, '2026-01')).toEqual({ mes: '2026-01', vendido: 0, cobrado: 0, pendiente: 0 })
  })
})

describe('listas del dashboard', () => {
  it('clientes con mayor saldo', () => {
    expect(mayoresSaldos(escenario())).toEqual([
      { clienteId: 'maria', saldo: 320_000 },
      { clienteId: 'carlos', saldo: 40_000 },
    ])
    expect(mayoresSaldos(escenario(), 1)).toHaveLength(1)
  })

  it('pendientes recientes, sin los pagados', () => {
    expect(numeros(pendientesRecientes(escenario()))).toEqual([1, 4, 2])
  })
})

describe('historial', () => {
  it('registra venta, abonos y venta pagada en orden', () => {
    const pedido = vista(
      1,
      maria,
      esika,
      esika10,
      '2026-10-07',
      [['Perfume', 1, 270_000]],
      [
        [100_000, '2026-10-07'],
        [70_000, '2026-10-15'],
        [100_000, '2026-10-20'],
      ],
    )
    const historial = construirHistorial([pedido]).reverse()
    expect(historial.map((m) => [m.tipo, m.fecha, m.valor])).toEqual([
      ['venta', '2026-10-07', 270_000],
      ['abono', '2026-10-07', 100_000],
      ['abono', '2026-10-15', 70_000],
      ['abono', '2026-10-20', 100_000],
      ['pagada', '2026-10-20', 0],
    ])
  })

  it('no marca como pagada una venta con saldo', () => {
    const tipos = construirHistorial(escenario()).map((m) => m.tipo)
    expect(tipos.filter((t) => t === 'venta')).toHaveLength(4)
    expect(tipos.filter((t) => t === 'abono')).toHaveLength(3)
    expect(tipos.filter((t) => t === 'pagada')).toHaveLength(1)
  })

  it('muestra primero lo más reciente', () => {
    const fechas = construirHistorial(escenario()).map((m) => m.fecha)
    expect(fechas).toEqual([...fechas].sort().reverse())
    expect(fechas[0]).toBe('2026-10-07')
  })

  it('si se elimina el abono final, la venta deja de figurar como pagada', () => {
    const pedidos = escenario()
    pedidos[2].abonos = []
    expect(construirHistorial(pedidos).some((m) => m.tipo === 'pagada')).toBe(false)
  })
})
