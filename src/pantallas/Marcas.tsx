import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { crearMarca, editarMarca, eliminarMarca } from '../datos/repositorios/marcas'
import type { Marca } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { Campo, ErrorGeneral, Insignia, Interruptor, claseEntrada, mensajeDe } from '../ui/Campo'
import { Confirmar, Hoja } from '../ui/Hoja'
import { EstadoVacio, Fila, Lista, Pantalla } from '../ui/Pantalla'
import { useEnvio } from '../ui/useEnvio'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

export function Marcas() {
  const [hoja, setHoja] = useState<Marca | 'nueva' | null>(null)
  const datos = useLiveQuery(async () => {
    const [marcas, campanas] = await Promise.all([db.marcas.toArray(), db.campanas.toArray()])
    const cuenta = new Map<string, number>()
    for (const c of campanas) cuenta.set(c.marcaId, (cuenta.get(c.marcaId) ?? 0) + 1)
    return marcas
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
      .map((marca) => ({ marca, campanas: cuenta.get(marca.id) ?? 0 }))
  }, [])

  return (
    <Pantalla
      titulo="Marcas"
      volverA="/mas"
      accion={
        <Boton variante="compacto" onClick={() => setHoja('nueva')}>
          Nueva
        </Boton>
      }
    >
      {datos?.length === 0 && (
        <EstadoVacio titulo="Sin marcas" detalle="Crea las marcas que vendes: Ésika, Novaventa, Marketing…" />
      )}
      {datos && datos.length > 0 && (
        <Lista etiqueta="Marcas">
          {datos.map(({ marca, campanas }) => (
            <Fila
              key={marca.id}
              titulo={marca.nombre}
              detalle={plural(campanas, 'campaña', 'campañas')}
              extra={!marca.activa && <Insignia>Inactiva</Insignia>}
              alTocar={() => setHoja(marca)}
            />
          ))}
        </Lista>
      )}
      {hoja && (
        <FormularioMarca
          marca={hoja === 'nueva' ? undefined : hoja}
          campanas={hoja === 'nueva' ? 0 : (datos?.find((d) => d.marca.id === hoja.id)?.campanas ?? 0)}
          alCerrar={() => setHoja(null)}
        />
      )}
    </Pantalla>
  )
}

function FormularioMarca({ marca, campanas, alCerrar }: { marca?: Marca; campanas: number; alCerrar: () => void }) {
  const [nombre, setNombre] = useState(marca?.nombre ?? '')
  const [activa, setActiva] = useState(marca?.activa ?? true)
  const [confirmando, setConfirmando] = useState(false)
  const { errores, enviando, enviar } = useEnvio()

  const guardar = () => (marca ? editarMarca(marca.id, { nombre, activa }) : crearMarca({ nombre }))

  return (
    <Hoja titulo={marca ? 'Editar marca' : 'Nueva marca'} alCerrar={alCerrar}>
      <form className="space-y-4" onSubmit={async (e) => (await enviar(guardar, e)) && alCerrar()}>
        <ErrorGeneral errores={errores} />
        <Campo etiqueta="Nombre" error={mensajeDe(errores, 'nombre')}>
          <input
            className={claseEntrada}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Ésika"
            autoFocus={!marca}
            autoComplete="off"
          />
        </Campo>
        {marca && (
          <Interruptor
            etiqueta="Marca activa"
            detalle="Las inactivas no aparecen al crear pedidos"
            activo={activa}
            alCambiar={setActiva}
          />
        )}
        <Boton type="submit" disabled={enviando}>
          Guardar
        </Boton>
        {marca && (
          <Boton variante="peligro" onClick={() => setConfirmando(true)}>
            Eliminar marca
          </Boton>
        )}
      </form>
      {confirmando && marca && (
        <Confirmar
          titulo={`¿Eliminar ${marca.nombre}?`}
          mensaje={
            campanas > 0
              ? `También se eliminarán sus ${plural(campanas, 'campaña', 'campañas')}. Esta acción no se puede deshacer.`
              : 'Esta acción no se puede deshacer.'
          }
          textoConfirmar="Eliminar"
          peligro
          alCancelar={() => setConfirmando(false)}
          alConfirmar={async () => {
            setConfirmando(false)
            if (await enviar(() => eliminarMarca(marca.id))) alCerrar()
          }}
        />
      )}
    </Hoja>
  )
}
