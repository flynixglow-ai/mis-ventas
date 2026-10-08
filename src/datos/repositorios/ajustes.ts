import { db } from '../db'
import { exigir } from '../errores'

export const CLAVE_INDICATIVO = 'indicativoPais'
/** Colombia. Se antepone al teléfono del cliente al abrir WhatsApp. */
export const INDICATIVO_POR_DEFECTO = '57'

export async function leerIndicativo(bd = db): Promise<string> {
  const guardado = (await bd.meta.get(CLAVE_INDICATIVO))?.valor
  return typeof guardado === 'string' && guardado ? guardado : INDICATIVO_POR_DEFECTO
}

export async function guardarIndicativo(valor: string, bd = db): Promise<void> {
  const digitos = valor.replace(/\D/g, '')
  exigir(
    digitos.length >= 1 && digitos.length <= 4
      ? []
      : [{ campo: 'indicativo', mensaje: 'Escribe el indicativo del país, de 1 a 4 números. Ej. 57.' }],
  )
  await bd.meta.put({ clave: CLAVE_INDICATIVO, valor: digitos })
}
