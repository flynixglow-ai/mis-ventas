import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseDatos } from './db'

let bd: BaseDatos

beforeEach(async () => {
  bd = new BaseDatos(`prueba-${crypto.randomUUID()}`)
  await bd.open()
})

afterEach(async () => {
  await bd.delete()
})

describe('base de datos', () => {
  it('abre con las siete tablas del modelo', () => {
    expect(bd.tables.map((t) => t.name).sort()).toEqual([
      'abonos',
      'campanas',
      'clientes',
      'items',
      'marcas',
      'meta',
      'pedidos',
    ])
  })

  it('guarda y recupera una marca', async () => {
    const marca = { id: 'm1', nombre: 'Ésika', activa: true, creadaEn: '2026-10-07T10:00:00.000Z' }
    await bd.marcas.add(marca)
    expect(await bd.marcas.get('m1')).toEqual(marca)
  })

  it('permite la misma campaña numérica en marcas distintas', async () => {
    const base = { estado: 'abierta' as const, creadaEn: '2026-10-07T10:00:00.000Z' }
    await bd.campanas.bulkAdd([
      { id: 'c1', marcaId: 'esika', nombre: 'Campaña 10', ...base },
      { id: 'c2', marcaId: 'novaventa', nombre: 'Campaña 10', ...base },
    ])
    const deEsika = await bd.campanas.where('marcaId').equals('esika').toArray()
    expect(deEsika.map((c) => c.id)).toEqual(['c1'])
  })

  it('rechaza dos pedidos con el mismo número', async () => {
    const base = {
      clienteId: 'cl1',
      marcaId: 'm1',
      campanaId: 'c1',
      fecha: '2026-10-07',
      notas: '',
      creadoEn: '2026-10-07T10:00:00.000Z',
    }
    await bd.pedidos.add({ id: 'p1', numero: 1, ...base })
    await expect(bd.pedidos.add({ id: 'p2', numero: 1, ...base })).rejects.toThrow()
  })

  it('revierte toda la transacción si una escritura falla', async () => {
    const marca = { id: 'm1', nombre: 'Ésika', activa: true, creadaEn: '2026-10-07T10:00:00.000Z' }
    await bd.marcas.add(marca)
    await expect(
      bd.transaction('rw', bd.marcas, async () => {
        await bd.marcas.clear()
        await bd.marcas.add({ ...marca, id: 'm2' })
        await bd.marcas.add({ ...marca, id: 'm2' }) // id repetido: falla
      }),
    ).rejects.toThrow()
    expect(await bd.marcas.toArray()).toEqual([marca])
  })
})
