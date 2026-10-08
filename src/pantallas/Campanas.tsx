import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { crearCampana, editarCampana, eliminarCampana } from '../datos/repositorios/campanas'
import { formatearFecha } from '../dominio/fechas'
import type { Campana, Marca } from '../dominio/tipos'
import { Boton } from '../ui/Boton'
import { Campo, ErrorGeneral, Insignia, claseArea, claseEntrada, mensajeDe } from '../ui/Campo'
import { Confirmar, Hoja } from '../ui/Hoja'
import { EstadoVacio, Fila, Lista, Pantalla } from '../ui/Pantalla'
import { useEnvio } from '../ui/useEnvio'

function fechasDe(c: Campana): string | undefined {
  if (c.fechaInicio && c.fechaCierre) return `${formatearFecha(c.fechaInicio)} – ${formatearFecha(c.fechaCierre)}`
  if (c.fechaInicio) return `Desde ${formatearFecha(c.fechaInicio)}`
  if (c.fechaCierre) return `Hasta ${formatearFecha(c.fechaCierre)}`
  return c.notas
}

export function Campanas() {
  const [hoja, setHoja] = useState<Campana | 'nueva' | null>(null)
  const datos = useLiveQuery(async () => {
    const [marcas, campanas] = await Promise.all([db.marcas.toArray(), db.campanas.toArray()])
    marcas.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    // Orden numérico descendente: "Campaña 10" queda antes que "Campaña 9".
    campanas.sort((a, b) => b.nombre.localeCompare(a.nombre, 'es', { numeric: true }))
    return { marcas, campanas }
  }, [])
  if (!datos) return <Pantalla titulo="Campañas" volverA="/mas" children={null} />

  const { marcas, campanas } = datos
  const grupos = marcas
    .map((marca) => ({ marca, lista: campanas.filter((c) => c.marcaId === marca.id) }))
    .filter((g) => g.lista.length > 0)

  return (
    <Pantalla
      titulo="Campañas"
      volverA="/mas"
      accion={
        marcas.length > 0 && (
          <Boton variante="compacto" onClick={() => setHoja('nueva')}>
            Nueva
          </Boton>
        )
      }
    >
      {marcas.length === 0 && (
        <EstadoVacio titulo="Primero crea una marca" detalle="Cada campaña pertenece a una marca.">
          <Link to="/mas/marcas" className="font-semibold text-acento">
            Ir a Marcas
          </Link>
        </EstadoVacio>
      )}
      {marcas.length > 0 && grupos.length === 0 && (
        <EstadoVacio titulo="Sin campañas" detalle="Crea la campaña en la que estás vendiendo." />
      )}
      <div className="space-y-6">
        {grupos.map(({ marca, lista }) => (
          <section key={marca.id} aria-label={marca.nombre}>
            <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold uppercase tracking-wide text-tenue">
              {marca.nombre}
              {!marca.activa && <Insignia>Inactiva</Insignia>}
            </h2>
            <Lista etiqueta={`Campañas de ${marca.nombre}`}>
              {lista.map((c) => (
                <Fila key={c.id} titulo={c.nombre} detalle={fechasDe(c)} alTocar={() => setHoja(c)} />
              ))}
            </Lista>
          </section>
        ))}
      </div>
      {hoja && (
        <FormularioCampana campana={hoja === 'nueva' ? undefined : hoja} marcas={marcas} alCerrar={() => setHoja(null)} />
      )}
    </Pantalla>
  )
}

interface PropsFormulario {
  campana?: Campana
  marcas: Marca[]
  alCerrar: () => void
}

function FormularioCampana({ campana, marcas, alCerrar }: PropsFormulario) {
  const elegibles = marcas.filter((m) => m.activa)
  const [marcaId, setMarcaId] = useState(campana?.marcaId ?? (elegibles.length === 1 ? elegibles[0].id : ''))
  const [nombre, setNombre] = useState(campana?.nombre ?? '')
  const [fechaInicio, setFechaInicio] = useState(campana?.fechaInicio ?? '')
  const [fechaCierre, setFechaCierre] = useState(campana?.fechaCierre ?? '')
  const [notas, setNotas] = useState(campana?.notas ?? '')
  const [confirmando, setConfirmando] = useState(false)
  const { errores, enviando, enviar } = useEnvio()

  const datos = { nombre, fechaInicio, fechaCierre, notas }
  const guardar = () => (campana ? editarCampana(campana.id, datos) : crearCampana({ marcaId, ...datos }))

  return (
    <Hoja titulo={campana ? 'Editar campaña' : 'Nueva campaña'} alCerrar={alCerrar}>
      <form className="space-y-4" onSubmit={async (e) => (await enviar(guardar, e)) && alCerrar()}>
        <ErrorGeneral errores={errores} />
        <Campo etiqueta="Marca" error={mensajeDe(errores, 'marcaId')}>
          {campana ? (
            <p className={`${claseEntrada} flex items-center text-tenue`}>
              {marcas.find((m) => m.id === campana.marcaId)?.nombre}
            </p>
          ) : (
            <select className={claseEntrada} value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
              <option value="">Selecciona una marca</option>
              {elegibles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          )}
        </Campo>
        <Campo etiqueta="Nombre o número" error={mensajeDe(errores, 'nombre')}>
          <input
            className={claseEntrada}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Campaña 10"
            autoComplete="off"
          />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo etiqueta="Inicio" opcional error={mensajeDe(errores, 'fechaInicio')}>
            <input type="date" className={claseEntrada} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </Campo>
          <Campo etiqueta="Cierre" opcional error={mensajeDe(errores, 'fechaCierre')}>
            <input type="date" className={claseEntrada} value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} />
          </Campo>
        </div>
        <Campo etiqueta="Notas" opcional>
          <textarea className={claseArea} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </Campo>
        <Boton type="submit" disabled={enviando}>
          Guardar
        </Boton>
        {campana && (
          <Boton variante="peligro" onClick={() => setConfirmando(true)}>
            Eliminar campaña
          </Boton>
        )}
      </form>
      {confirmando && campana && (
        <Confirmar
          titulo={`¿Eliminar ${campana.nombre}?`}
          mensaje="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          peligro
          alCancelar={() => setConfirmando(false)}
          alConfirmar={async () => {
            setConfirmando(false)
            if (await enviar(() => eliminarCampana(campana.id))) alCerrar()
          }}
        />
      )}
    </Hoja>
  )
}
