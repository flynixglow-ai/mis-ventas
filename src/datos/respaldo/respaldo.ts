import { hoy } from '../../dominio/fechas'
import { db, VERSION_ESQUEMA } from '../db'
import { ahora } from '../ids'
import { CLAVE_ULTIMO_NUMERO } from '../repositorios/pedidos'
import { APP_COPIA, FORMATO_COPIA, type Copia, type DatosCopia } from './copia'

export const CLAVE_ULTIMA_COPIA = 'ultimaCopia'

async function leerTodo(bd = db): Promise<DatosCopia> {
  const [marcas, campanas, clientes, pedidos, items, abonos, meta] = await Promise.all([
    bd.marcas.toArray(),
    bd.campanas.toArray(),
    bd.clientes.toArray(),
    bd.pedidos.toArray(),
    bd.items.toArray(),
    bd.abonos.toArray(),
    bd.meta.toArray(),
  ])
  return { marcas, campanas, clientes, pedidos, items, abonos, meta }
}

export const leerDatosActuales = leerTodo

/** Arma la copia completa. Todo lo necesario para llevar los datos a otro teléfono. */
export async function crearCopia(bd = db): Promise<Copia> {
  return {
    app: APP_COPIA,
    formato: FORMATO_COPIA,
    versionEsquema: VERSION_ESQUEMA,
    exportadoEn: ahora(),
    datos: await bd.transaction('r', bd.tables, () => leerTodo(bd)),
  }
}

export function nombreArchivoCopia(fecha = hoy()): string {
  return `mis-ventas-${fecha}.json`
}

export async function marcarCopiaHecha(bd = db): Promise<void> {
  await bd.meta.put({ clave: CLAVE_ULTIMA_COPIA, valor: ahora() })
}

/**
 * Reemplaza TODOS los datos por los de una copia ya validada con validarCopia.
 * Va en una sola transacción: si algo falla, los datos actuales quedan intactos.
 */
export function restaurarCopia(copia: Copia, bd = db): Promise<void> {
  const { datos } = copia
  return bd.transaction('rw', bd.tables, async () => {
    await Promise.all(bd.tables.map((tabla) => tabla.clear()))
    await bd.marcas.bulkAdd(datos.marcas)
    await bd.campanas.bulkAdd(datos.campanas)
    await bd.clientes.bulkAdd(datos.clientes)
    await bd.pedidos.bulkAdd(datos.pedidos)
    await bd.items.bulkAdd(datos.items)
    await bd.abonos.bulkAdd(datos.abonos)
    await bd.meta.bulkAdd(datos.meta)

    // El consecutivo nunca puede quedar por detrás del mayor número existente.
    const guardado = Number((await bd.meta.get(CLAVE_ULTIMO_NUMERO))?.valor ?? 0)
    const mayor = datos.pedidos.reduce((max, p) => Math.max(max, p.numero), 0)
    await bd.meta.put({ clave: CLAVE_ULTIMO_NUMERO, valor: Math.max(guardado, mayor) })
    // Lo restaurado está respaldado, como mínimo, desde la fecha del archivo.
    if (copia.exportadoEn) await bd.meta.put({ clave: CLAVE_ULTIMA_COPIA, valor: copia.exportadoEn })
  })
}
