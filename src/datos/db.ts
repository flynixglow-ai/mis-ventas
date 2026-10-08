import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Abono, Campana, Cliente, Item, Marca, Meta, Pedido } from '../dominio/tipos'

export const NOMBRE_BD = 'mis-ventas'
export const VERSION_ESQUEMA = 1

export class BaseDatos extends Dexie {
  marcas!: EntityTable<Marca, 'id'>
  campanas!: EntityTable<Campana, 'id'>
  clientes!: EntityTable<Cliente, 'id'>
  pedidos!: EntityTable<Pedido, 'id'>
  items!: EntityTable<Item, 'id'>
  abonos!: EntityTable<Abono, 'id'>
  meta!: Table<Meta, string>

  constructor(nombre = NOMBRE_BD) {
    super(nombre)
    // Solo se declaran los campos indexados. Para cambiar el esquema se agrega
    // una version(n+1) con su upgrade(); nunca se edita una versión publicada.
    this.version(1).stores({
      marcas: 'id, nombre',
      campanas: 'id, marcaId, [marcaId+nombre]',
      clientes: 'id, nombre, estado',
      pedidos: 'id, &numero, clienteId, marcaId, campanaId, fecha',
      items: 'id, pedidoId',
      abonos: 'id, pedidoId, fecha',
      meta: 'clave',
    })
  }
}

export const db = new BaseDatos()

/** Pide al navegador que no borre los datos por falta de espacio o desuso. */
export async function pedirAlmacenamientoPersistente(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
