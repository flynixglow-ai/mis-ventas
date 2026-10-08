import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseDatos } from '../db'
import { crearCampana } from '../repositorios/campanas'
import { crearCliente } from '../repositorios/clientes'
import { cargarVistas } from '../repositorios/consultas'
import { crearMarca } from '../repositorios/marcas'
import { CLAVE_ULTIMO_NUMERO, crearPedido, eliminarPedido, registrarAbono } from '../repositorios/pedidos'
import { validarCopia, type Copia } from './copia'
import { generarCsv } from './csv'
import { CLAVE_ULTIMA_COPIA, crearCopia, leerDatosActuales, nombreArchivoCopia, restaurarCopia } from './respaldo'

const HOY = '2026-10-08'
let bd: BaseDatos
let otra: BaseDatos

const nueva = async () => {
  const b = new BaseDatos(`prueba-${crypto.randomUUID()}`)
  await b.open()
  return b
}

/** Dos marcas, dos campañas, dos clientes y tres pedidos (#1, #2 y #4; el #3 se eliminó). */
async function llenar(b: BaseDatos) {
  const esika = await crearMarca({ nombre: 'Ésika' }, b)
  const novaventa = await crearMarca({ nombre: 'Novaventa' }, b)
  const e10 = await crearCampana({ marcaId: esika.id, nombre: 'Campaña 10', notas: 'Navidad; "especial"' }, b)
  const n5 = await crearCampana({ marcaId: novaventa.id, nombre: 'Campaña 5' }, b)
  const maria = await crearCliente({ nombre: 'María López', telefono: '300 123 4567', notas: '' }, b)
  const carlos = await crearCliente({ nombre: 'Carlos Gómez', telefono: '', notas: '' }, b)
  const base = { fecha: '2026-10-07', notas: '' }
  const p1 = await crearPedido(
    {
      ...base,
      clienteId: maria.id,
      marcaId: esika.id,
      campanaId: e10.id,
      notas: 'Entregar; en la tarde',
      items: [
        { nombre: 'Perfume', cantidad: 1, valorUnitario: 120_000 },
        { nombre: 'Base', cantidad: 1, valorUnitario: 80_000 },
        { nombre: 'Labial "rojo"', cantidad: 2, valorUnitario: 35_000 },
      ],
    },
    { valor: 100_000, metodo: 'nequi' },
    b,
  )
  await registrarAbono(p1.id, { valor: 70_000, fecha: '2026-10-15', metodo: 'efectivo', nota: 'Segunda parte' }, b)
  const simple = (clienteId: string, valor: number) => ({
    ...base,
    fecha: '2026-09-20',
    clienteId,
    marcaId: novaventa.id,
    campanaId: n5.id,
    fechaLimite: '2026-10-01',
    items: [{ nombre: 'Crema', cantidad: 1, valorUnitario: valor }],
  })
  await crearPedido(simple(maria.id, 450_000), { valor: 300_000, metodo: 'transferencia' }, b)
  const p3 = await crearPedido(simple(carlos.id, 10_000), undefined, b)
  await eliminarPedido(p3.id, b)
  await crearPedido(simple(carlos.id, 40_000), undefined, b)
}

const texto = async (b = bd) => JSON.stringify(await crearCopia(b))
const alterar = async (cambio: (c: Copia) => void) => {
  const copia = JSON.parse(await texto()) as Copia
  cambio(copia)
  return validarCopia(JSON.stringify(copia))
}
const erroresDe = async (cambio: (c: Copia) => void) => {
  const r = await alterar(cambio)
  return r.ok ? [] : r.errores
}

beforeEach(async () => {
  bd = await nueva()
  otra = await nueva()
  await llenar(bd)
})
afterEach(async () => {
  await bd.delete()
  await otra.delete()
})

describe('exportar', () => {
  it('incluye todas las tablas y la identificación del archivo', async () => {
    const copia = await crearCopia(bd)
    expect(copia).toMatchObject({ app: 'mis-ventas', formato: 1, versionEsquema: 1 })
    expect(Date.parse(copia.exportadoEn)).not.toBeNaN()
    expect(Object.keys(copia.datos).sort()).toEqual(['abonos', 'campanas', 'clientes', 'items', 'marcas', 'meta', 'pedidos'])
    expect(copia.datos.pedidos.map((p) => p.numero).sort()).toEqual([1, 2, 4])
    expect(nombreArchivoCopia(HOY)).toBe('mis-ventas-2026-10-08.json')
  })

  it('la copia recién exportada es válida y su resumen coincide', async () => {
    const r = validarCopia(await texto())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.resumen).toEqual({ marcas: 2, campanas: 2, clientes: 2, pedidos: 3, productos: 5, abonos: 3, porCobrar: 290_000 })
  })
})

describe('validar antes de restaurar', () => {
  it('rechaza un archivo que no es JSON o no es de la app', async () => {
    expect(validarCopia('hola')).toMatchObject({ ok: false })
    expect(validarCopia('')).toMatchObject({ ok: false })
    expect(validarCopia('[]')).toMatchObject({ ok: false })
    expect(validarCopia('{"app":"otra-app","formato":1,"datos":{}}')).toEqual({
      ok: false,
      errores: ['El archivo no es una copia de seguridad de Mis Ventas.'],
    })
  })

  it('rechaza una copia de un formato más nuevo', async () => {
    expect((await erroresDe((c) => (c.formato = 99)))[0]).toMatch(/versión más nueva/)
  })

  it('rechaza si falta una tabla', async () => {
    expect(await erroresDe((c) => delete (c.datos as Partial<Copia['datos']>).abonos)).toEqual(['Falta la lista de abonos.'])
    expect((await erroresDe((c) => ((c as { datos: unknown }).datos = null)))[0]).toMatch(/no contiene datos/)
  })

  it('rechaza registros con campos faltantes o de tipo incorrecto', async () => {
    expect(await erroresDe((c) => delete (c.datos.clientes[0] as Partial<Copia['datos']['clientes'][0]>).nombre)).toEqual([
      'clientes, registro 1: falta "nombre".',
    ])
    expect(await erroresDe((c) => ((c.datos.abonos[0] as { valor: unknown }).valor = '100000'))).toEqual([
      'abonos, registro 1: "valor" no es válido.',
    ])
    expect(await erroresDe((c) => (c.datos.pedidos[0].fecha = '2026-02-30'))).toEqual(['pedidos, registro 1: "fecha" no es válido.'])
    expect(await erroresDe((c) => (c.datos.items[0].cantidad = 0))).toEqual(['productos, registro 1: "cantidad" no es válido.'])
    expect(await erroresDe((c) => ((c.datos.abonos[0] as { metodo: string }).metodo = 'cheque'))).toHaveLength(1)
  })

  it('rechaza relaciones rotas', async () => {
    expect((await erroresDe((c) => c.datos.clientes.pop()))[0]).toMatch(/cliente que no está en la copia/)
    expect((await erroresDe((c) => (c.datos.campanas[0].marcaId = 'no-existe')))[0]).toMatch(/marca que no está en la copia/)
    expect(await erroresDe((c) => (c.datos.pedidos = c.datos.pedidos.filter((p) => p.numero !== 1)))).toEqual([
      'Hay productos (3) de pedidos que no están en la copia.',
      'Hay abonos (2) de pedidos que no están en la copia.',
    ])
    expect(
      (await erroresDe((c) => (c.datos.pedidos[0].campanaId = c.datos.campanas.find((k) => k.marcaId !== c.datos.pedidos[0].marcaId)!.id)))[0],
    ).toMatch(/campaña que no es de su marca/)
  })

  it('rechaza identificadores y números de pedido repetidos', async () => {
    expect((await erroresDe((c) => c.datos.marcas.push(c.datos.marcas[0])))[0]).toMatch(/identificador repetido/)
    expect((await erroresDe((c) => (c.datos.pedidos[1].numero = c.datos.pedidos[0].numero)))[0]).toMatch(/está repetido/)
  })

  it('limita la lista cuando hay muchos problemas', async () => {
    const errores = await erroresDe((c) => c.datos.items.forEach((i) => ((i as { nombre: unknown }).nombre = 5)))
    expect(errores).toHaveLength(5)
    const muchos = await erroresDe((c) => {
      c.datos.items = Array.from({ length: 30 }, () => ({}) as Copia['datos']['items'][0])
    })
    expect(muchos).toHaveLength(9)
    expect(muchos.at(-1)).toMatch(/problemas más/)
  })

  it('descarta campos desconocidos sin rechazar la copia', async () => {
    const r = await alterar((c) => ((c.datos.marcas[0] as unknown as Record<string, unknown>).intruso = 'x'))
    expect(r.ok && r.copia.datos.marcas[0]).not.toHaveProperty('intruso')
  })
})

describe('restaurar', () => {
  it('lleva todos los datos a otro teléfono (base vacía) sin perder nada', async () => {
    const r = validarCopia(await texto())
    if (!r.ok) throw new Error('la copia debía ser válida')
    await restaurarCopia(r.copia, otra)

    const original = await leerDatosActuales(bd)
    const restaurado = await leerDatosActuales(otra)
    for (const tabla of ['marcas', 'campanas', 'clientes', 'pedidos', 'items', 'abonos'] as const) {
      const porId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id)
      expect([...restaurado[tabla]].sort(porId)).toEqual(JSON.parse(JSON.stringify([...original[tabla]].sort(porId))))
    }
    const vistas = await cargarVistas(otra)
    expect(vistas).toHaveLength(3)
    expect(vistas.find((v) => v.pedido.numero === 1)!.items.map((i) => i.nombre)).toEqual(['Perfume', 'Base', 'Labial "rojo"'])
  })

  it('reemplaza por completo los datos que hubiera', async () => {
    await crearMarca({ nombre: 'Marca vieja' }, otra)
    await crearCliente({ nombre: 'Cliente viejo', telefono: '', notas: '' }, otra)
    const r = validarCopia(await texto())
    if (!r.ok) throw new Error('la copia debía ser válida')
    await restaurarCopia(r.copia, otra)
    expect((await otra.marcas.toArray()).map((m) => m.nombre).sort()).toEqual(['Novaventa', 'Ésika'])
    expect(await otra.clientes.count()).toBe(2)
  })

  it('conserva el consecutivo: el siguiente pedido no reutiliza números', async () => {
    const r = validarCopia(await texto())
    if (!r.ok) throw new Error('la copia debía ser válida')
    await restaurarCopia(r.copia, otra)
    const [cliente] = await otra.clientes.toArray()
    const [campana] = await otra.campanas.toArray()
    const pedido = await crearPedido(
      { clienteId: cliente.id, marcaId: campana.marcaId, campanaId: campana.id, fecha: HOY, items: [{ nombre: 'X', cantidad: 1, valorUnitario: 1 }] },
      undefined,
      otra,
    )
    expect(pedido.numero).toBe(5)
  })

  it('si la copia trae un consecutivo atrasado, lo corrige al mayor número', async () => {
    const r = await alterar((c) => (c.datos.meta = c.datos.meta.filter((m) => m.clave !== CLAVE_ULTIMO_NUMERO)))
    if (!r.ok) throw new Error('la copia debía ser válida')
    await restaurarCopia(r.copia, otra)
    expect((await otra.meta.get(CLAVE_ULTIMO_NUMERO))?.valor).toBe(4)
    expect((await otra.meta.get(CLAVE_ULTIMA_COPIA))?.valor).toBe(r.copia.exportadoEn)
  })

  it('si la restauración falla a medias, los datos actuales quedan intactos', async () => {
    await crearMarca({ nombre: 'Mis datos actuales' }, otra)
    const copia = await crearCopia(bd)
    copia.datos.abonos.push(copia.datos.abonos[0]) // identificador repetido: falla al escribir
    await expect(restaurarCopia(copia, otra)).rejects.toThrow()
    expect((await otra.marcas.toArray()).map((m) => m.nombre)).toEqual(['Mis datos actuales'])
    expect(await otra.pedidos.count()).toBe(0)
  })
})

describe('CSV', () => {
  it('genera pedidos, productos y abonos listos para Excel', async () => {
    const [pedidos, productos, abonos] = generarCsv(await cargarVistas(bd), HOY)
    expect([pedidos.nombre, productos.nombre, abonos.nombre]).toEqual([
      'mis-ventas-pedidos-2026-10-08.csv',
      'mis-ventas-productos-2026-10-08.csv',
      'mis-ventas-abonos-2026-10-08.csv',
    ])
    for (const archivo of [pedidos, productos, abonos]) expect(archivo.contenido.startsWith('﻿')).toBe(true)

    const lineas = pedidos.contenido.slice(1).trimEnd().split('\r\n')
    expect(lineas[0]).toBe('Pedido;Cliente;Marca;Campaña;Teléfono;Fecha;Fecha límite;Total;Abonado;Saldo;Estado;Vencido;Notas')
    expect(lineas[1]).toBe('1;María López;Ésika;Campaña 10;300 123 4567;2026-10-07;;270000;170000;100000;Pago parcial;No;"Entregar; en la tarde"')
    expect(lineas[2]).toBe('2;María López;Novaventa;Campaña 5;300 123 4567;2026-09-20;2026-10-01;450000;300000;150000;Pago parcial;Sí;')
    expect(lineas).toHaveLength(4)

    expect(productos.contenido).toContain('1;María López;Ésika;Campaña 10;2026-10-07;"Labial ""rojo""";2;35000;70000')
    expect(productos.contenido.trimEnd().split('\r\n')).toHaveLength(6)
    expect(abonos.contenido).toContain('1;María López;Ésika;Campaña 10;2026-10-15;70000;Efectivo;Segunda parte')
    expect(abonos.contenido.trimEnd().split('\r\n')).toHaveLength(4)
  })

  it('sin pedidos solo trae los encabezados', () => {
    expect(generarCsv([], HOY).map((a) => a.contenido.trimEnd().split('\r\n').length)).toEqual([1, 1, 1])
  })
})
