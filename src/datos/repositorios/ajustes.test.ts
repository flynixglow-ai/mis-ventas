import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BaseDatos } from '../db'
import { ErrorDeNegocio } from '../errores'
import { guardarIndicativo, leerIndicativo } from './ajustes'

let bd: BaseDatos
beforeEach(async () => {
  bd = new BaseDatos(`prueba-${crypto.randomUUID()}`)
  await bd.open()
})
afterEach(() => bd.delete())

describe('indicativo de país para WhatsApp', () => {
  it('por defecto es el de Colombia', async () => {
    expect(await leerIndicativo(bd)).toBe('57')
  })

  it('se puede cambiar y acepta que se escriba con +', async () => {
    await guardarIndicativo(' +52 ', bd)
    expect(await leerIndicativo(bd)).toBe('52')
  })

  it('rechaza valores vacíos o demasiado largos, y conserva el anterior', async () => {
    await guardarIndicativo('1', bd)
    await expect(guardarIndicativo('', bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    await expect(guardarIndicativo('abc', bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    await expect(guardarIndicativo('12345', bd)).rejects.toBeInstanceOf(ErrorDeNegocio)
    expect(await leerIndicativo(bd)).toBe('1')
  })
})
