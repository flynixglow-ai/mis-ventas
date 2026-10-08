import { validarCampana } from '../../dominio/validaciones'
import type { Campana, Id } from '../../dominio/tipos'
import { db } from '../db'
import { exigir, rechazar } from '../errores'
import { ahora, nuevoId, opcional } from '../ids'

export interface DatosCampana {
  nombre: string
  fechaInicio?: string
  fechaCierre?: string
  notas?: string
}

const limpiar = (d: DatosCampana) => ({
  nombre: d.nombre.trim(),
  fechaInicio: opcional(d.fechaInicio),
  fechaCierre: opcional(d.fechaCierre),
  notas: opcional(d.notas),
})

export function crearCampana(datos: DatosCampana & { marcaId: Id }, bd = db): Promise<Campana> {
  return bd.transaction('rw', bd.marcas, bd.campanas, async () => {
    const limpio = { marcaId: datos.marcaId, ...limpiar(datos) }
    exigir(validarCampana(limpio, await bd.campanas.where('marcaId').equals(datos.marcaId).toArray()))
    if (!(await bd.marcas.get(datos.marcaId))) rechazar('La marca seleccionada ya no existe.')
    const campana: Campana = { id: nuevoId(), ...limpio, estado: 'abierta', creadaEn: ahora() }
    await bd.campanas.add(campana)
    return campana
  })
}

/** La marca de una campaña no cambia después de creada: sus pedidos dependen de ella. */
export function editarCampana(id: Id, datos: DatosCampana, bd = db): Promise<void> {
  return bd.transaction('rw', bd.campanas, async () => {
    const actual = await bd.campanas.get(id)
    if (!actual) rechazar('La campaña ya no existe.')
    const limpio = limpiar(datos)
    exigir(
      validarCampana(
        { marcaId: actual.marcaId, ...limpio },
        await bd.campanas.where('marcaId').equals(actual.marcaId).toArray(),
        id,
      ),
    )
    await bd.campanas.put({ ...actual, ...limpio })
  })
}

export function eliminarCampana(id: Id, bd = db): Promise<void> {
  return bd.transaction('rw', bd.campanas, bd.pedidos, async () => {
    if ((await bd.pedidos.where('campanaId').equals(id).count()) > 0) {
      rechazar('Esta campaña tiene pedidos y no se puede eliminar.')
    }
    await bd.campanas.delete(id)
  })
}
