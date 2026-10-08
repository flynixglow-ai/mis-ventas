import { totalAbonado, totalPedido } from '../../dominio/calculos'
import { esFechaValida } from '../../dominio/fechas'
import { METODOS_PAGO, type Abono, type Campana, type Cliente, type Item, type Marca, type Meta, type Pedido } from '../../dominio/tipos'

export const APP_COPIA = 'mis-ventas'
/** Versión del formato del archivo de copia. Subirla solo si cambia su estructura. */
export const FORMATO_COPIA = 1

export interface DatosCopia {
  marcas: Marca[]
  campanas: Campana[]
  clientes: Cliente[]
  pedidos: Pedido[]
  items: Item[]
  abonos: Abono[]
  meta: Meta[]
}

export interface Copia {
  app: typeof APP_COPIA
  formato: number
  versionEsquema: number
  exportadoEn: string
  datos: DatosCopia
}

export interface ResumenDatos {
  marcas: number
  campanas: number
  clientes: number
  pedidos: number
  productos: number
  abonos: number
  porCobrar: number
}

export type ResultadoValidacion =
  | { ok: true; copia: Copia; resumen: ResumenDatos }
  | { ok: false; errores: string[] }

export function resumirDatos(datos: DatosCopia): ResumenDatos {
  return {
    marcas: datos.marcas.length,
    campanas: datos.campanas.length,
    clientes: datos.clientes.length,
    pedidos: datos.pedidos.length,
    productos: datos.items.length,
    abonos: datos.abonos.length,
    porCobrar: totalPedido(datos.items) - totalAbonado(datos.abonos),
  }
}

// ---------- Esquema del archivo ----------

type Comprobar = (valor: unknown) => boolean
const texto: Comprobar = (v) => typeof v === 'string'
const noVacio: Comprobar = (v) => typeof v === 'string' && v.trim() !== ''
const booleano: Comprobar = (v) => typeof v === 'boolean'
const entero: Comprobar = (v) => Number.isSafeInteger(v)
const positivo: Comprobar = (v) => Number.isSafeInteger(v) && (v as number) > 0
const noNegativo: Comprobar = (v) => Number.isSafeInteger(v) && (v as number) >= 0
const fecha: Comprobar = (v) => esFechaValida(v)
const uno = (opciones: readonly string[]): Comprobar => (v) => typeof v === 'string' && opciones.includes(v)

interface Campo {
  comprobar: Comprobar
  opcional?: boolean
}
const req = (comprobar: Comprobar): Campo => ({ comprobar })
const opc = (comprobar: Comprobar): Campo => ({ comprobar, opcional: true })

const TABLAS = ['marcas', 'campanas', 'clientes', 'pedidos', 'items', 'abonos', 'meta'] as const
type Tabla = (typeof TABLAS)[number]

const NOMBRE_TABLA: Record<Tabla, string> = {
  marcas: 'marcas',
  campanas: 'campañas',
  clientes: 'clientes',
  pedidos: 'pedidos',
  items: 'productos',
  abonos: 'abonos',
  meta: 'ajustes',
}

const ESQUEMA: Record<Tabla, Record<string, Campo>> = {
  marcas: { id: req(noVacio), nombre: req(noVacio), activa: req(booleano), creadaEn: req(texto) },
  campanas: {
    id: req(noVacio),
    marcaId: req(noVacio),
    nombre: req(noVacio),
    fechaInicio: opc(fecha),
    fechaCierre: opc(fecha),
    estado: req(uno(['abierta', 'cerrada'])),
    notas: opc(texto),
    creadaEn: req(texto),
  },
  clientes: {
    id: req(noVacio),
    nombre: req(noVacio),
    telefono: req(texto),
    notas: req(texto),
    estado: req(uno(['activo', 'archivado'])),
    creadoEn: req(texto),
  },
  pedidos: {
    id: req(noVacio),
    numero: req(positivo),
    clienteId: req(noVacio),
    marcaId: req(noVacio),
    campanaId: req(noVacio),
    fecha: req(fecha),
    fechaLimite: opc(fecha),
    notas: req(texto),
    creadoEn: req(texto),
  },
  items: {
    id: req(noVacio),
    pedidoId: req(noVacio),
    orden: req(entero),
    nombre: req(noVacio),
    cantidad: req(positivo),
    valorUnitario: req(noNegativo),
    productoId: opc(noVacio),
    costoUnitario: opc(noNegativo),
  },
  abonos: {
    id: req(noVacio),
    pedidoId: req(noVacio),
    valor: req(positivo),
    fecha: req(fecha),
    metodo: req(uno(METODOS_PAGO)),
    nota: opc(texto),
    creadoEn: req(texto),
  },
  meta: { clave: req(noVacio), valor: req((v) => typeof v === 'string' || typeof v === 'number') },
}

const MAX_ERRORES = 8
const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Revisa por completo un archivo de copia ANTES de tocar la base de datos:
 * formato, campos de cada registro y relaciones entre tablas. Devuelve una
 * copia limpia (solo con los campos conocidos) o la lista de problemas.
 */
export function validarCopia(contenido: string): ResultadoValidacion {
  let crudo: unknown
  try {
    crudo = JSON.parse(contenido)
  } catch {
    return { ok: false, errores: ['El archivo no es una copia de seguridad válida (no se pudo leer).'] }
  }
  if (!esObjeto(crudo) || crudo.app !== APP_COPIA) {
    return { ok: false, errores: ['El archivo no es una copia de seguridad de Mis Ventas.'] }
  }
  if (!Number.isSafeInteger(crudo.formato) || (crudo.formato as number) < 1) {
    return { ok: false, errores: ['La copia no indica su versión de formato.'] }
  }
  if ((crudo.formato as number) > FORMATO_COPIA) {
    return { ok: false, errores: ['La copia fue creada con una versión más nueva de Mis Ventas. Actualiza la aplicación e intenta de nuevo.'] }
  }
  if (!esObjeto(crudo.datos)) return { ok: false, errores: ['La copia no contiene datos.'] }

  const errores: string[] = []
  const datos = {} as Record<Tabla, Record<string, unknown>[]>

  for (const tabla of TABLAS) {
    const filas = crudo.datos[tabla]
    if (!Array.isArray(filas)) {
      errores.push(`Falta la lista de ${NOMBRE_TABLA[tabla]}.`)
      datos[tabla] = []
      continue
    }
    const clave = tabla === 'meta' ? 'clave' : 'id'
    const vistos = new Set<unknown>()
    datos[tabla] = filas.map((fila, i) => {
      const donde = `${NOMBRE_TABLA[tabla]}, registro ${i + 1}`
      if (!esObjeto(fila)) {
        errores.push(`${donde}: no es un registro válido.`)
        return {}
      }
      const limpio: Record<string, unknown> = {}
      for (const [campo, regla] of Object.entries(ESQUEMA[tabla])) {
        const valor = fila[campo]
        if (valor === undefined || valor === null) {
          if (!regla.opcional) errores.push(`${donde}: falta "${campo}".`)
        } else if (!regla.comprobar(valor)) {
          errores.push(`${donde}: "${campo}" no es válido.`)
        } else {
          limpio[campo] = valor
        }
      }
      if (vistos.has(limpio[clave])) errores.push(`${donde}: identificador repetido.`)
      vistos.add(limpio[clave])
      return limpio
    })
  }

  // Relaciones: solo tiene sentido revisarlas si los registros están bien formados.
  if (errores.length === 0) {
    const ids = (tabla: Tabla) => new Set(datos[tabla].map((f) => f.id))
    const marcas = ids('marcas')
    const clientes = ids('clientes')
    const pedidos = ids('pedidos')
    const marcaDeCampana = new Map(datos.campanas.map((c) => [c.id, c.marcaId]))

    datos.campanas.forEach((c) => {
      if (!marcas.has(c.marcaId)) errores.push(`La campaña "${c.nombre}" pertenece a una marca que no está en la copia.`)
    })
    const numeros = new Set<unknown>()
    datos.pedidos.forEach((p) => {
      const cual = `El pedido #${p.numero}`
      if (numeros.has(p.numero)) errores.push(`${cual} está repetido.`)
      numeros.add(p.numero)
      if (!clientes.has(p.clienteId)) errores.push(`${cual} es de un cliente que no está en la copia.`)
      if (!marcas.has(p.marcaId)) errores.push(`${cual} es de una marca que no está en la copia.`)
      if (!marcaDeCampana.has(p.campanaId)) errores.push(`${cual} es de una campaña que no está en la copia.`)
      else if (marcaDeCampana.get(p.campanaId) !== p.marcaId) errores.push(`${cual} tiene una campaña que no es de su marca.`)
    })
    for (const tabla of ['items', 'abonos'] as const) {
      const huerfanos = datos[tabla].filter((f) => !pedidos.has(f.pedidoId)).length
      if (huerfanos > 0) errores.push(`Hay ${NOMBRE_TABLA[tabla]} (${huerfanos}) de pedidos que no están en la copia.`)
    }
  }

  if (errores.length > 0) {
    const resto = errores.length - MAX_ERRORES
    return { ok: false, errores: resto > 0 ? [...errores.slice(0, MAX_ERRORES), `…y ${resto} problemas más.`] : errores }
  }

  const limpios = datos as unknown as DatosCopia
  const copia: Copia = {
    app: APP_COPIA,
    formato: crudo.formato as number,
    versionEsquema: Number.isSafeInteger(crudo.versionEsquema) ? (crudo.versionEsquema as number) : 1,
    exportadoEn: typeof crudo.exportadoEn === 'string' ? crudo.exportadoEn : '',
    datos: limpios,
  }
  return { ok: true, copia, resumen: resumirDatos(limpios) }
}
