import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseDatos } from '../db'
import { ErrorDeNegocio } from '../errores'
import { crearCampana, editarCampana, eliminarCampana } from './campanas'
import { cambiarEstadoCliente, crearCliente, editarCliente, eliminarCliente } from './clientes'
import { crearMarca, editarMarca, eliminarMarca } from './marcas'

let bd: BaseDatos

beforeEach(async () => {
  bd = new BaseDatos(`prueba-${crypto.randomUUID()}`)
  await bd.open()
})
afterEach(() => bd.delete())

function pedidoDe(ids: { clienteId?: string; marcaId?: string; campanaId?: string }) {
  return bd.pedidos.add({
    id: crypto.randomUUID(),
    numero: Math.floor(Math.random() * 1e9),
    clienteId: 'x',
    marcaId: 'x',
    campanaId: 'x',
    ...ids,
    fecha: '2026-10-07',
    notas: '',
    creadoEn: '2026-10-07T10:00:00.000Z',
  })
}

describe('marcas', () => {
  it('crea una marca activa', async () => {
    const marca = await crearMarca({ nombre: '  Ésika ' }, bd)
    expect(await bd.marcas.get(marca.id)).toMatchObject({ nombre: 'Ésika', activa: true })
    expect(marca.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('no admite nombre vacío ni repetido', async () => {
    await crearMarca({ nombre: 'Ésika' }, bd)
    await expect(crearMarca({ nombre: '' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    await expect(crearMarca({ nombre: 'ESIKA' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    expect(await bd.marcas.count()).toBe(1)
  })

  it('edita el nombre y permite desactivarla', async () => {
    const a = await crearMarca({ nombre: 'Esica' }, bd)
    const b = await crearMarca({ nombre: 'Novaventa' }, bd)
    await editarMarca(a.id, { nombre: 'Ésika', activa: false }, bd)
    expect(await bd.marcas.get(a.id)).toMatchObject({ nombre: 'Ésika', activa: false })
    await expect(editarMarca(b.id, { nombre: 'Ésika', activa: true }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
  })

  it('al eliminarla se van sus campañas, no las de otras marcas', async () => {
    const a = await crearMarca({ nombre: 'Ésika' }, bd)
    const b = await crearMarca({ nombre: 'Novaventa' }, bd)
    await crearCampana({ marcaId: a.id, nombre: 'Campaña 10' }, bd)
    const deB = await crearCampana({ marcaId: b.id, nombre: 'Campaña 10' }, bd)
    await eliminarMarca(a.id, bd)
    expect((await bd.marcas.toArray()).map((m) => m.id)).toEqual([b.id])
    expect((await bd.campanas.toArray()).map((c) => c.id)).toEqual([deB.id])
  })

  it('no se elimina si tiene pedidos, y sus campañas quedan intactas', async () => {
    const a = await crearMarca({ nombre: 'Ésika' }, bd)
    await crearCampana({ marcaId: a.id, nombre: 'Campaña 10' }, bd)
    await pedidoDe({ marcaId: a.id })
    await expect(eliminarMarca(a.id, bd)).rejects.toThrow(/tiene pedidos/)
    expect(await bd.marcas.count()).toBe(1)
    expect(await bd.campanas.count()).toBe(1)
  })
})

describe('campañas', () => {
  it('crea una campaña abierta dentro de su marca', async () => {
    const marca = await crearMarca({ nombre: 'Ésika' }, bd)
    const c = await crearCampana(
      { marcaId: marca.id, nombre: ' Campaña 10 ', fechaInicio: '2026-10-01', fechaCierre: '', notas: '  ' },
      bd,
    )
    const guardada = await bd.campanas.get(c.id)
    expect(guardada).toMatchObject({ marcaId: marca.id, nombre: 'Campaña 10', estado: 'abierta', fechaInicio: '2026-10-01' })
    expect(guardada).not.toHaveProperty('fechaCierre', '')
    expect(guardada?.notas).toBeUndefined()
  })

  it('la misma campaña numérica existe en dos marcas pero no dos veces en una', async () => {
    const a = await crearMarca({ nombre: 'Ésika' }, bd)
    const b = await crearMarca({ nombre: 'Novaventa' }, bd)
    await crearCampana({ marcaId: a.id, nombre: 'Campaña 10' }, bd)
    await crearCampana({ marcaId: b.id, nombre: 'Campaña 10' }, bd)
    await expect(crearCampana({ marcaId: a.id, nombre: 'campaña 10' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    expect(await bd.campanas.count()).toBe(2)
  })

  it('no se crea sin marca o con una marca inexistente', async () => {
    await expect(crearCampana({ marcaId: '', nombre: 'C1' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    await expect(crearCampana({ marcaId: 'no-existe', nombre: 'C1' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    expect(await bd.campanas.count()).toBe(0)
  })

  it('se edita conservando marca, estado y fecha de creación', async () => {
    const marca = await crearMarca({ nombre: 'Ésika' }, bd)
    const c = await crearCampana({ marcaId: marca.id, nombre: 'Campaña 10', notas: 'Navidad' }, bd)
    await editarCampana(c.id, { nombre: 'Campaña 11', fechaCierre: '2026-11-30' }, bd)
    const editada = await bd.campanas.get(c.id)
    expect(editada).toMatchObject({
      marcaId: marca.id,
      nombre: 'Campaña 11',
      estado: 'abierta',
      creadaEn: c.creadaEn,
      fechaCierre: '2026-11-30',
    })
    expect(editada?.notas).toBeUndefined()
  })

  it('rechaza fechas incoherentes al editar', async () => {
    const marca = await crearMarca({ nombre: 'Ésika' }, bd)
    const c = await crearCampana({ marcaId: marca.id, nombre: 'Campaña 10' }, bd)
    await expect(
      editarCampana(c.id, { nombre: 'Campaña 10', fechaInicio: '2026-10-10', fechaCierre: '2026-10-01' }, bd),
    ).rejects.toBeInstanceOf(ErrorDeNegocio)
  })

  it('se elimina solo si no tiene pedidos', async () => {
    const marca = await crearMarca({ nombre: 'Ésika' }, bd)
    const conPedidos = await crearCampana({ marcaId: marca.id, nombre: 'Campaña 10' }, bd)
    const vacia = await crearCampana({ marcaId: marca.id, nombre: 'Campaña 11' }, bd)
    await pedidoDe({ campanaId: conPedidos.id })
    await expect(eliminarCampana(conPedidos.id, bd)).rejects.toThrow(/tiene pedidos/)
    await eliminarCampana(vacia.id, bd)
    expect((await bd.campanas.toArray()).map((c) => c.id)).toEqual([conPedidos.id])
  })
})

describe('clientes', () => {
  const maria = { nombre: ' María   López ', telefono: ' 300 123 4567 ', notas: '' }

  it('crea un cliente activo', async () => {
    const c = await crearCliente(maria, bd)
    expect(await bd.clientes.get(c.id)).toMatchObject({ nombre: 'María López', telefono: '300 123 4567', estado: 'activo' })
  })

  it('no admite cliente sin nombre', async () => {
    await expect(crearCliente({ ...maria, nombre: '  ' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    expect(await bd.clientes.count()).toBe(0)
  })

  it('edita sus datos', async () => {
    const c = await crearCliente(maria, bd)
    await editarCliente(c.id, { nombre: 'María López', telefono: '310 000 0000', notas: 'Paga los viernes' }, bd)
    expect(await bd.clientes.get(c.id)).toMatchObject({ telefono: '310 000 0000', notas: 'Paga los viernes' })
    await expect(editarCliente(c.id, { ...maria, nombre: '' }, bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
  })

  it('archivar y reactivar conserva sus pedidos', async () => {
    const c = await crearCliente(maria, bd)
    await pedidoDe({ clienteId: c.id })
    await cambiarEstadoCliente(c.id, 'archivado', bd)
    expect((await bd.clientes.get(c.id))?.estado).toBe('archivado')
    expect(await bd.pedidos.where('clienteId').equals(c.id).count()).toBe(1)
    await cambiarEstadoCliente(c.id, 'activo', bd)
    expect((await bd.clientes.get(c.id))?.estado).toBe('activo')
  })

  it('solo se elimina si no tiene pedidos', async () => {
    const conPedidos = await crearCliente(maria, bd)
    const sinPedidos = await crearCliente({ nombre: 'Carlos Gómez', telefono: '', notas: '' }, bd)
    await pedidoDe({ clienteId: conPedidos.id })
    await expect(eliminarCliente(conPedidos.id, bd)).rejects.toThrow(/tiene pedidos/)
    await eliminarCliente(sinPedidos.id, bd)
    expect((await bd.clientes.toArray()).map((c) => c.id)).toEqual([conPedidos.id])
  })
})
