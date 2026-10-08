import { describe, expect, it } from 'vitest'
import { coincideCliente, filtrarPedidos, type FiltrosPedidos } from './busqueda'
import { enlaceWhatsApp, mensajeResumenCliente } from './whatsapp'
import { HOY, carlos, escenario, maria, numeros } from './datosDePrueba'

const filtrar = (filtros: FiltrosPedidos) => numeros(filtrarPedidos(escenario(), filtros, HOY))

describe('filtros de pedidos', () => {
  it('sin filtros devuelve todo, lo más reciente primero', () => {
    expect(filtrar({})).toEqual([1, 4, 3, 2])
  })

  it('por estado', () => {
    expect(filtrar({ estado: 'todas' })).toHaveLength(4)
    expect(filtrar({ estado: 'pendientes' })).toEqual([4])
    expect(filtrar({ estado: 'parcial' })).toEqual([1, 2])
    expect(filtrar({ estado: 'vencidas' })).toEqual([2])
    expect(filtrar({ estado: 'pagadas' })).toEqual([3])
  })

  it('por marca', () => {
    expect(filtrar({ marcaId: 'esika' })).toEqual([1, 3])
    expect(filtrar({ marcaId: 'novaventa' })).toEqual([4, 2])
  })

  it('por marca + campaña', () => {
    expect(filtrar({ marcaId: 'esika', campanaId: 'e10' })).toEqual([1, 3])
    expect(filtrar({ marcaId: 'novaventa', campanaId: 'n10' })).toEqual([4])
  })

  it('por cliente y por rango de fechas', () => {
    expect(filtrar({ clienteId: 'carlos' })).toEqual([4, 3])
    expect(filtrar({ desde: '2026-10-06' })).toEqual([1, 4])
    expect(filtrar({ desde: '2026-09-01', hasta: '2026-10-05' })).toEqual([3, 2])
  })

  it('combina filtros', () => {
    expect(filtrar({ marcaId: 'esika', estado: 'pagadas' })).toEqual([3])
    expect(filtrar({ clienteId: 'maria', estado: 'pendientes' })).toEqual([])
  })
})

describe('búsqueda', () => {
  it('por cliente, sin importar tildes ni mayúsculas', () => {
    expect(filtrar({ texto: 'maria' })).toEqual([1, 2])
    expect(filtrar({ texto: 'MARÍA' })).toEqual([1, 2])
  })

  it('por producto', () => {
    expect(filtrar({ texto: 'Perfume' })).toEqual([1])
    expect(filtrar({ texto: 'jabon' })).toEqual([4])
  })

  it('por marca y por campaña', () => {
    expect(filtrar({ texto: 'Ésika' })).toEqual([1, 3])
    expect(filtrar({ texto: 'Campaña 5' })).toEqual([2])
    expect(filtrar({ texto: 'esika campaña 10' })).toEqual([1, 3])
  })

  it('por número de pedido', () => {
    expect(filtrar({ texto: '#0003' })).toEqual([3])
    expect(filtrar({ texto: '#3' })).toEqual([3])
    expect(filtrar({ texto: '0004' })).toEqual([4])
    expect(filtrar({ texto: '#99' })).toEqual([])
  })

  it('texto vacío no filtra y texto sin coincidencias no devuelve nada', () => {
    expect(filtrar({ texto: '   ' })).toHaveLength(4)
    expect(filtrar({ texto: 'zapatos' })).toEqual([])
  })

  it('busca clientes por nombre o teléfono', () => {
    expect(coincideCliente(maria, 'lopez')).toBe(true)
    expect(coincideCliente(maria, '300 123')).toBe(true)
    expect(coincideCliente(carlos, 'lopez')).toBe(false)
    expect(coincideCliente(carlos, '')).toBe(true)
  })
})

describe('WhatsApp', () => {
  const deMaria = () => escenario().filter((v) => v.cliente.id === 'maria')

  it('genera el resumen de pedidos pendientes del cliente', () => {
    expect(mensajeResumenCliente(maria, deMaria())).toBe(
      [
        'Hola María, te comparto el resumen de tus pedidos pendientes:',
        '',
        'Novaventa — Campaña 5',
        'Total: $450.000',
        'Pagado: $300.000',
        'Pendiente: $150.000',
        '',
        'Ésika — Campaña 10',
        'Total: $270.000',
        'Pagado: $100.000',
        'Pendiente: $170.000',
        '',
        'Total pendiente:',
        '$320.000',
      ].join('\n'),
    )
  })

  it('omite los pedidos pagados y suma los de una misma campaña', () => {
    const pedidos = escenario()
    const deCarlos = pedidos.filter((v) => v.cliente.id === 'carlos')
    const mensaje = mensajeResumenCliente(carlos, deCarlos)!
    expect(mensaje).not.toContain('Ésika')
    expect(mensaje).toContain('Novaventa — Campaña 10\nTotal: $40.000\nPagado: $0\nPendiente: $40.000')

    const repetido = { ...deCarlos[1], pedido: { ...deCarlos[1].pedido, id: 'p5', numero: 5 } }
    expect(mensajeResumenCliente(carlos, [...deCarlos, repetido])).toContain('Total: $80.000')
  })

  it('no usa las palabras deuda ni préstamo', () => {
    expect(mensajeResumenCliente(maria, deMaria())).not.toMatch(/deuda|pr[eé]stamo/i)
  })

  it('no genera mensaje si el cliente no tiene saldo', () => {
    const pagados = escenario().filter((v) => v.pedido.numero === 3)
    expect(mensajeResumenCliente(carlos, pagados)).toBeNull()
    expect(mensajeResumenCliente(carlos, [])).toBeNull()
  })

  it('arma el enlace con indicativo de país', () => {
    expect(enlaceWhatsApp('300 123 4567', 'Hola María')).toBe('https://wa.me/573001234567?text=Hola%20Mar%C3%ADa')
    expect(enlaceWhatsApp('+1 (555) 010-2030', 'x')).toBe('https://wa.me/15550102030?text=x')
    expect(enlaceWhatsApp('3001234567', 'x', '52')).toBe('https://wa.me/523001234567?text=x')
    expect(enlaceWhatsApp('', 'a&b')).toBe('https://wa.me/?text=a%26b')
  })
})
