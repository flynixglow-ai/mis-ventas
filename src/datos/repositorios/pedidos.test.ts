import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resumirPedido } from '../../dominio/calculos'
import { agrupar } from '../../dominio/reportes'
import type { Campana, Cliente, Marca } from '../../dominio/tipos'
import { BaseDatos } from '../db'
import { ErrorDeNegocio } from '../errores'
import { crearCampana } from './campanas'
import { cambiarEstadoCliente, crearCliente, eliminarCliente } from './clientes'
import { cargarVista, cargarVistas } from './consultas'
import { eliminarMarca } from './marcas'
import { crearMarca } from './marcas'
import {
  CLAVE_ULTIMO_NUMERO,
  crearPedido,
  editarPedido,
  eliminarAbono,
  eliminarPedido,
  registrarAbono,
  type DatosPedido,
} from './pedidos'

const HOY = '2026-10-07'
let bd: BaseDatos
let esika: Marca, novaventa: Marca
let esika10: Campana, novaventa5: Campana
let maria: Cliente, carlos: Cliente

beforeEach(async () => {
  bd = new BaseDatos(`prueba-${crypto.randomUUID()}`)
  await bd.open()
  esika = await crearMarca({ nombre: 'Ésika' }, bd)
  novaventa = await crearMarca({ nombre: 'Novaventa' }, bd)
  esika10 = await crearCampana({ marcaId: esika.id, nombre: 'Campaña 10' }, bd)
  novaventa5 = await crearCampana({ marcaId: novaventa.id, nombre: 'Campaña 5' }, bd)
  maria = await crearCliente({ nombre: 'María López', telefono: '300 123 4567', notas: '' }, bd)
  carlos = await crearCliente({ nombre: 'Carlos Gómez', telefono: '', notas: '' }, bd)
})
afterEach(() => bd.delete())

const pedidoDeMaria = (): DatosPedido => ({
  clienteId: maria.id,
  marcaId: esika.id,
  campanaId: esika10.id,
  fecha: HOY,
  items: [
    { nombre: 'Perfume', cantidad: 1, valorUnitario: 120_000 },
    { nombre: 'Base', cantidad: 1, valorUnitario: 80_000 },
    { nombre: 'Labial', cantidad: 2, valorUnitario: 35_000 },
  ],
})
const simple = (valor: number, extra: Partial<DatosPedido> = {}): DatosPedido => ({
  ...pedidoDeMaria(),
  items: [{ nombre: 'Producto', cantidad: 1, valorUnitario: valor }],
  ...extra,
})
const resumen = async (id: string) => resumirPedido((await cargarVista(id, bd))!, HOY)
const pago = (valor: number, fecha = HOY) => ({ valor, fecha, metodo: 'efectivo' })

describe('crear pedido', () => {
  it('guarda el pedido con varios productos y calcula el total', async () => {
    const pedido = await crearPedido(pedidoDeMaria(), undefined, bd)
    const vista = (await cargarVista(pedido.id, bd))!
    expect(pedido.numero).toBe(1)
    expect(vista.items.map((i) => [i.nombre, i.cantidad, i.valorUnitario])).toEqual([
      ['Perfume', 1, 120_000],
      ['Base', 1, 80_000],
      ['Labial', 2, 35_000],
    ])
    expect(vista.cliente.nombre).toBe('María López')
    expect(vista.marca.nombre).toBe('Ésika')
    expect(vista.campana.nombre).toBe('Campaña 10')
    expect(await resumen(pedido.id)).toMatchObject({ total: 270_000, abonado: 0, saldo: 270_000, estado: 'pendiente' })
  })

  it('acepta los campos opcionales vacíos tal como llegan del formulario', async () => {
    const pedido = await crearPedido({ ...pedidoDeMaria(), fechaLimite: '', notas: '' }, { valor: 0, metodo: 'efectivo' }, bd)
    expect((await bd.pedidos.get(pedido.id))?.fechaLimite).toBeUndefined()
    await editarPedido(pedido.id, { ...pedidoDeMaria(), fechaLimite: '2026-10-30' }, bd)
    await editarPedido(pedido.id, { ...pedidoDeMaria(), fechaLimite: '' }, bd)
    expect((await bd.pedidos.get(pedido.id))?.fechaLimite).toBeUndefined()
  })

  it('no guarda total, saldo ni estado en la base de datos', async () => {
    const pedido = await crearPedido(pedidoDeMaria(), { valor: 100_000, metodo: 'nequi' }, bd)
    const guardado = await bd.pedidos.get(pedido.id)
    for (const campo of ['total', 'saldo', 'abonado', 'estado']) expect(guardado).not.toHaveProperty(campo)
  })

  it('registra el abono inicial con la fecha de la venta y su método', async () => {
    const pedido = await crearPedido({ ...pedidoDeMaria(), fecha: '2026-10-01' }, { valor: 100_000, metodo: 'nequi' }, bd)
    const [abono] = await bd.abonos.where('pedidoId').equals(pedido.id).toArray()
    expect(abono).toMatchObject({ valor: 100_000, fecha: '2026-10-01', metodo: 'nequi' })
    expect(await resumen(pedido.id)).toMatchObject({ abonado: 100_000, saldo: 170_000, estado: 'parcial' })
  })

  it('un abono inicial por el total deja el pedido pagado', async () => {
    const pedido = await crearPedido(pedidoDeMaria(), { valor: 270_000, metodo: 'efectivo' }, bd)
    expect(await resumen(pedido.id)).toMatchObject({ saldo: 0, estado: 'pagado' })
  })

  it('numera en consecutivo y no reutiliza el número de un pedido eliminado', async () => {
    const numeros: number[] = []
    for (let i = 0; i < 3; i++) numeros.push((await crearPedido(simple(1000), undefined, bd)).numero)
    const tercero = (await bd.pedidos.where('numero').equals(3).first())!
    await eliminarPedido(tercero.id, bd)
    numeros.push((await crearPedido(simple(1000), undefined, bd)).numero)
    expect(numeros).toEqual([1, 2, 3, 4])
    expect((await bd.pedidos.toArray()).map((p) => p.numero).sort()).toEqual([1, 2, 4])
  })

  it('si algo es inválido no guarda nada ni gasta el número', async () => {
    const invalido = { ...pedidoDeMaria(), items: [{ nombre: '', cantidad: 0, valorUnitario: -1 }] }
    await expect(crearPedido(invalido, undefined, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    await expect(crearPedido(pedidoDeMaria(), { valor: 300_000, metodo: 'efectivo' }, bd)).rejects.toThrow(/superar el saldo/)
    expect(await bd.pedidos.count()).toBe(0)
    expect(await bd.items.count()).toBe(0)
    expect(await bd.abonos.count()).toBe(0)
    expect(await bd.meta.get(CLAVE_ULTIMO_NUMERO)).toBeUndefined()
    expect((await crearPedido(pedidoDeMaria(), undefined, bd)).numero).toBe(1)
  })

  it('rechaza pedido sin cliente, con campaña de otra marca o con cliente archivado', async () => {
    await expect(crearPedido({ ...pedidoDeMaria(), clienteId: '' }, undefined, bd)).rejects.toThrow(/cliente/)
    await expect(crearPedido({ ...pedidoDeMaria(), campanaId: novaventa5.id }, undefined, bd)).rejects.toThrow(
      /no pertenece a la marca/,
    )
    await cambiarEstadoCliente(maria.id, 'archivado', bd)
    await expect(crearPedido(pedidoDeMaria(), undefined, bd)).rejects.toThrow(/archivado/)
    expect(await bd.pedidos.count()).toBe(0)
  })
})

describe('abonos', () => {
  it('sigue el ejemplo completo: $100.000, $70.000 y $100.000 hasta quedar pagado', async () => {
    const pedido = await crearPedido(pedidoDeMaria(), { valor: 100_000, metodo: 'efectivo' }, bd)
    await registrarAbono(pedido.id, pago(70_000, '2026-10-15'), bd)
    expect(await resumen(pedido.id)).toMatchObject({ abonado: 170_000, saldo: 100_000, estado: 'parcial' })
    await registrarAbono(pedido.id, { ...pago(100_000, '2026-10-20'), metodo: 'transferencia', nota: ' Último pago ' }, bd)
    expect(await resumen(pedido.id)).toMatchObject({ abonado: 270_000, saldo: 0, estado: 'pagado' })
    const abonos = await bd.abonos.where('pedidoId').equals(pedido.id).sortBy('fecha')
    expect(abonos.map((a) => [a.fecha, a.valor, a.metodo, a.nota])).toEqual([
      [HOY, 100_000, 'efectivo', undefined],
      ['2026-10-15', 70_000, 'efectivo', undefined],
      ['2026-10-20', 100_000, 'transferencia', 'Último pago'],
    ])
  })

  it('rechaza $0, negativos, superiores al saldo, fecha inválida y método vacío', async () => {
    const pedido = await crearPedido(simple(100_000), undefined, bd)
    for (const malo of [
      pago(0),
      pago(-5),
      pago(100_001),
      pago(1000, '2026-02-30'),
      { valor: 1000, fecha: HOY, metodo: '' },
    ]) {
      await expect(registrarAbono(pedido.id, malo, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    }
    expect(await bd.abonos.count()).toBe(0)
  })

  it('no admite más abonos cuando ya está pagado', async () => {
    const pedido = await crearPedido(simple(50_000), { valor: 50_000, metodo: 'efectivo' }, bd)
    await expect(registrarAbono(pedido.id, pago(1), bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
  })

  it('al eliminar un abono el saldo vuelve a subir', async () => {
    const pedido = await crearPedido(simple(100_000), undefined, bd)
    const abono = await registrarAbono(pedido.id, pago(100_000), bd)
    expect((await resumen(pedido.id)).estado).toBe('pagado')
    await eliminarAbono(abono.id, bd)
    expect(await resumen(pedido.id)).toMatchObject({ saldo: 100_000, estado: 'pendiente' })
  })

  it('rechaza abonar a un pedido que no existe', async () => {
    await expect(registrarAbono('no-existe', pago(1000), bd)).rejects.toThrow(/ya no existe/)
  })
})

describe('editar pedido', () => {
  it('cambia productos, fechas y notas conservando número y abonos', async () => {
    const pedido = await crearPedido(pedidoDeMaria(), { valor: 100_000, metodo: 'efectivo' }, bd)
    await editarPedido(
      pedido.id,
      {
        ...pedidoDeMaria(),
        fechaLimite: '2026-10-30',
        notas: ' Entregar el viernes ',
        items: [
          { nombre: 'Perfume', cantidad: 2, valorUnitario: 120_000 },
          { nombre: 'Crema', cantidad: 1, valorUnitario: 60_000 },
        ],
      },
      bd,
    )
    const vista = (await cargarVista(pedido.id, bd))!
    expect(vista.pedido).toMatchObject({ numero: 1, fechaLimite: '2026-10-30', notas: 'Entregar el viernes', creadoEn: pedido.creadoEn })
    expect(vista.items.map((i) => i.nombre)).toEqual(['Perfume', 'Crema'])
    expect(await bd.items.count()).toBe(2)
    expect(await resumen(pedido.id)).toMatchObject({ total: 300_000, abonado: 100_000, saldo: 200_000 })
  })

  it('con $250.000 abonados no deja bajar el total a $200.000, y no cambia nada', async () => {
    const pedido = await crearPedido(simple(300_000), { valor: 250_000, metodo: 'efectivo' }, bd)
    await expect(editarPedido(pedido.id, simple(200_000), bd)).rejects.toThrow(/\$200\.000.*\$250\.000/)
    expect((await resumen(pedido.id)).total).toBe(300_000)
  })

  it('sí deja bajar hasta lo abonado exacto y subir el total', async () => {
    const pedido = await crearPedido(simple(300_000), { valor: 250_000, metodo: 'efectivo' }, bd)
    await editarPedido(pedido.id, simple(250_000), bd)
    expect(await resumen(pedido.id)).toMatchObject({ saldo: 0, estado: 'pagado' })
    await editarPedido(pedido.id, simple(400_000), bd)
    expect(await resumen(pedido.id)).toMatchObject({ saldo: 150_000, estado: 'parcial' })
  })

  it('permite corregir el pedido de un cliente archivado, pero no pasarlo a otro archivado', async () => {
    const pedido = await crearPedido(simple(100_000), undefined, bd)
    await cambiarEstadoCliente(maria.id, 'archivado', bd)
    await editarPedido(pedido.id, simple(120_000), bd)
    expect((await resumen(pedido.id)).total).toBe(120_000)

    const deCarlos = await crearPedido(simple(50_000, { clienteId: carlos.id }), undefined, bd)
    await expect(editarPedido(deCarlos.id, simple(50_000), bd)).rejects.toThrow(/archivado/)
  })

  it('rechaza cambiar a una campaña de otra marca', async () => {
    const pedido = await crearPedido(simple(100_000), undefined, bd)
    await expect(editarPedido(pedido.id, simple(100_000, { campanaId: novaventa5.id }), bd)).rejects.toThrow(/no pertenece/)
    await editarPedido(pedido.id, simple(100_000, { marcaId: novaventa.id, campanaId: novaventa5.id }), bd)
    expect((await cargarVista(pedido.id, bd))!.marca.nombre).toBe('Novaventa')
  })
})

describe('eliminar y consultar', () => {
  it('eliminar un pedido borra sus productos y abonos, no los de otros', async () => {
    const uno = await crearPedido(pedidoDeMaria(), { valor: 100_000, metodo: 'efectivo' }, bd)
    const otro = await crearPedido(simple(50_000), { valor: 10_000, metodo: 'efectivo' }, bd)
    await eliminarPedido(uno.id, bd)
    expect((await bd.pedidos.toArray()).map((p) => p.id)).toEqual([otro.id])
    expect(await bd.items.count()).toBe(1)
    expect(await bd.abonos.count()).toBe(1)
  })

  it('con pedidos, ni el cliente ni la marca se pueden eliminar', async () => {
    await crearPedido(pedidoDeMaria(), undefined, bd)
    await expect(eliminarCliente(maria.id, bd)).rejects.toThrow(/tiene pedidos/)
    await expect(eliminarMarca(esika.id, bd)).rejects.toThrow(/tiene pedidos/)
  })

  it('varios pedidos del mismo cliente en marcas distintas suman su saldo', async () => {
    await crearPedido(pedidoDeMaria(), { valor: 100_000, metodo: 'efectivo' }, bd)
    await crearPedido(simple(450_000, { marcaId: novaventa.id, campanaId: novaventa5.id }), { valor: 300_000, metodo: 'nequi' }, bd)
    await crearPedido(simple(40_000, { clienteId: carlos.id }), undefined, bd)

    const vistas = await cargarVistas(bd)
    expect(vistas).toHaveLength(3)
    expect(agrupar(vistas, (v) => v.pedido.clienteId).get(maria.id)).toMatchObject({
      vendido: 720_000,
      cobrado: 400_000,
      pendiente: 320_000,
      pedidos: 2,
    })
    expect(agrupar(vistas, (v) => v.pedido.marcaId).get(esika.id)).toMatchObject({ vendido: 310_000, pendiente: 210_000 })
    expect(agrupar(vistas, (v) => v.pedido.campanaId).get(novaventa5.id)).toMatchObject({ pendiente: 150_000 })
  })
})
