import { describe, expect, it } from 'vitest'
import {
  validarAbono,
  validarCampana,
  validarCliente,
  validarItem,
  validarMarca,
  validarPedido,
  validarPedidoEditado,
  validarPedidoNuevo,
  type BorradorPedido,
} from './validaciones'

const campos = (errores: { campo: string }[]) => errores.map((e) => e.campo)

const pedidoValido: BorradorPedido = {
  clienteId: 'maria',
  marcaId: 'esika',
  campanaId: 'e10',
  fecha: '2026-10-07',
  items: [{ nombre: 'Perfume', cantidad: 1, valorUnitario: 120_000 }],
}
const campanaEsika = { marcaId: 'esika', estado: 'abierta' as const }

describe('marca, campaña y cliente', () => {
  const marcas = [{ id: 'm1', nombre: 'Ésika' }]
  const campanas = [{ id: 'c1', marcaId: 'esika', nombre: 'Campaña 10' }]

  it('la marca necesita un nombre que no esté repetido', () => {
    expect(validarMarca({ nombre: 'Novaventa' }, marcas)).toEqual([])
    expect(campos(validarMarca({ nombre: '   ' }, marcas))).toEqual(['nombre'])
    expect(campos(validarMarca({ nombre: 'esika' }, marcas))).toEqual(['nombre'])
  })

  it('una marca puede conservar su propio nombre al editarse', () => {
    expect(validarMarca({ nombre: 'Ésika' }, marcas, 'm1')).toEqual([])
  })

  it('la misma campaña numérica puede existir en otra marca, no en la misma', () => {
    expect(validarCampana({ marcaId: 'novaventa', nombre: 'Campaña 10' }, campanas)).toEqual([])
    expect(campos(validarCampana({ marcaId: 'esika', nombre: 'campaña 10' }, campanas))).toEqual(['nombre'])
  })

  it('la campaña necesita marca, nombre y fechas coherentes', () => {
    expect(campos(validarCampana({ marcaId: '', nombre: '' }, campanas))).toEqual(['marcaId', 'nombre'])
    expect(
      campos(
        validarCampana({ marcaId: 'esika', nombre: 'C11', fechaInicio: '2026-10-10', fechaCierre: '2026-10-01' }, campanas),
      ),
    ).toEqual(['fechaCierre'])
    expect(campos(validarCampana({ marcaId: 'esika', nombre: 'C11', fechaInicio: '2026-02-30' }, campanas))).toEqual([
      'fechaInicio',
    ])
  })

  it('el cliente necesita nombre', () => {
    expect(validarCliente({ nombre: 'María López' })).toEqual([])
    expect(campos(validarCliente({ nombre: '' }))).toEqual(['nombre'])
  })
})

describe('productos', () => {
  it('acepta un producto correcto, incluso con precio 0', () => {
    expect(validarItem({ nombre: 'Muestra', cantidad: 1, valorUnitario: 0 })).toEqual([])
  })

  it('rechaza producto sin nombre', () => {
    expect(campos(validarItem({ nombre: ' ', cantidad: 1, valorUnitario: 100 }, 2))).toEqual(['items.2.nombre'])
  })

  it('rechaza cantidad 0, negativa o con decimales', () => {
    for (const cantidad of [0, -1, 1.5, NaN]) {
      expect(campos(validarItem({ nombre: 'X', cantidad, valorUnitario: 100 }))).toEqual(['items.0.cantidad'])
    }
  })

  it('rechaza precio negativo', () => {
    expect(campos(validarItem({ nombre: 'X', cantidad: 1, valorUnitario: -1 }))).toEqual(['items.0.valorUnitario'])
  })
})

describe('abonos', () => {
  const base = { fecha: '2026-10-07', metodo: 'nequi' }

  it('acepta un abono parcial y uno por el saldo exacto', () => {
    expect(validarAbono({ ...base, valor: 70_000 }, 170_000)).toEqual([])
    expect(validarAbono({ ...base, valor: 170_000 }, 170_000)).toEqual([])
  })

  it('rechaza $0 y valores negativos', () => {
    expect(campos(validarAbono({ ...base, valor: 0 }, 170_000))).toEqual(['valor'])
    expect(campos(validarAbono({ ...base, valor: -100 }, 170_000))).toEqual(['valor'])
  })

  it('rechaza un abono superior al saldo', () => {
    const [e] = validarAbono({ ...base, valor: 170_001 }, 170_000)
    expect(e.campo).toBe('valor')
    expect(e.mensaje).toContain('$170.000')
  })

  it('no admite abonos en un pedido ya pagado', () => {
    expect(campos(validarAbono({ ...base, valor: 1 }, 0))).toEqual(['valor'])
  })

  it('rechaza fecha inválida y método desconocido', () => {
    expect(campos(validarAbono({ valor: 100, fecha: '2026-02-31', metodo: 'nequi' }, 1000))).toEqual(['fecha'])
    expect(campos(validarAbono({ valor: 100, fecha: '2026-10-07', metodo: 'cheque' }, 1000))).toEqual(['metodo'])
    expect(campos(validarAbono({ valor: 100, fecha: '2026-10-07', metodo: '' }, 1000))).toEqual(['metodo'])
  })
})

describe('pedidos', () => {
  it('acepta un pedido completo', () => {
    expect(validarPedido(pedidoValido, { campana: campanaEsika, cliente: { estado: 'activo' } })).toEqual([])
  })

  it('rechaza pedido sin cliente, marca, campaña ni productos', () => {
    expect(campos(validarPedido({ clienteId: '', marcaId: '', campanaId: '', fecha: '2026-10-07', items: [] }))).toEqual([
      'clienteId',
      'marcaId',
      'campanaId',
      'items',
    ])
  })

  it('rechaza una campaña de otra marca', () => {
    const errores = validarPedido(pedidoValido, { campana: { marcaId: 'novaventa', estado: 'abierta' } })
    expect(campos(errores)).toEqual(['campanaId'])
  })

  it('rechaza una campaña cerrada y un cliente archivado', () => {
    expect(campos(validarPedido(pedidoValido, { campana: { marcaId: 'esika', estado: 'cerrada' } }))).toEqual(['campanaId'])
    expect(campos(validarPedido(pedidoValido, { cliente: { estado: 'archivado' } }))).toEqual(['clienteId'])
  })

  it('rechaza fechas inválidas y fecha límite anterior a la venta', () => {
    expect(campos(validarPedido({ ...pedidoValido, fecha: 'ayer' }))).toEqual(['fecha'])
    expect(campos(validarPedido({ ...pedidoValido, fechaLimite: '2026-10-06' }))).toEqual(['fechaLimite'])
    expect(campos(validarPedido({ ...pedidoValido, fechaLimite: '2026-10-32' }))).toEqual(['fechaLimite'])
    expect(validarPedido({ ...pedidoValido, fechaLimite: '2026-10-07' })).toEqual([])
  })

  it('señala el producto inválido dentro del pedido', () => {
    const items = [pedidoValido.items[0], { nombre: '', cantidad: 0, valorUnitario: 10 }]
    expect(campos(validarPedido({ ...pedidoValido, items }))).toEqual(['items.1.nombre', 'items.1.cantidad'])
  })
})

describe('pedido nuevo con abono inicial', () => {
  it('acepta sin abono inicial, aunque no haya método', () => {
    expect(validarPedidoNuevo(pedidoValido, { valor: 0, metodo: '' })).toEqual([])
  })

  it('acepta abono inicial parcial o por el total', () => {
    expect(validarPedidoNuevo(pedidoValido, { valor: 100_000, metodo: 'efectivo' })).toEqual([])
    expect(validarPedidoNuevo(pedidoValido, { valor: 120_000, metodo: 'efectivo' })).toEqual([])
  })

  it('rechaza abono inicial mayor que el total, negativo o sin método', () => {
    expect(campos(validarPedidoNuevo(pedidoValido, { valor: 120_001, metodo: 'efectivo' }))).toEqual(['abonoInicial.valor'])
    expect(campos(validarPedidoNuevo(pedidoValido, { valor: -1, metodo: 'efectivo' }))).toEqual(['abonoInicial.valor'])
    expect(campos(validarPedidoNuevo(pedidoValido, { valor: 1000, metodo: '' }))).toEqual(['abonoInicial.metodo'])
  })
})

describe('edición de un pedido con abonos', () => {
  const con = (valorUnitario: number): BorradorPedido => ({
    ...pedidoValido,
    items: [{ nombre: 'Perfume', cantidad: 1, valorUnitario }],
  })

  it('no permite que el total quede por debajo de lo abonado', () => {
    const [e] = validarPedidoEditado(con(200_000), 250_000)
    expect(e.campo).toBe('items')
    expect(e.mensaje).toContain('$200.000')
    expect(e.mensaje).toContain('$250.000')
  })

  it('permite bajar el total hasta lo abonado exacto', () => {
    expect(validarPedidoEditado(con(250_000), 250_000)).toEqual([])
  })

  it('permite aumentar el total', () => {
    expect(validarPedidoEditado(con(400_000), 250_000)).toEqual([])
  })

  it('sin abonos se puede cambiar libremente, pero no dejarlo sin productos', () => {
    expect(validarPedidoEditado(con(10), 0)).toEqual([])
    expect(campos(validarPedidoEditado({ ...pedidoValido, items: [] }, 0))).toEqual(['items'])
  })
})
