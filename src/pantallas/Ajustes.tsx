import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { version } from '../../package.json'
import { pedirAlmacenamientoPersistente } from '../datos/db'
import { guardarIndicativo, leerIndicativo } from '../datos/repositorios/ajustes'
import { Boton } from '../ui/Boton'
import { Campo, claseEntrada, mensajeDe } from '../ui/Campo'
import { Pantalla, Tarjeta } from '../ui/Pantalla'
import { useEnvio } from '../ui/useEnvio'

export function Ajustes() {
  const guardado = useLiveQuery(() => leerIndicativo(), [])
  if (guardado === undefined) return null
  return <Formulario guardado={guardado} />
}

function Formulario({ guardado }: { guardado: string }) {
  const [indicativo, setIndicativo] = useState(guardado)
  const [listo, setListo] = useState(false)
  const [protegido, setProtegido] = useState<boolean | null>(null)
  const { errores, enviando, enviar } = useEnvio()

  useEffect(() => {
    void pedirAlmacenamientoPersistente().then(setProtegido)
  }, [])

  return (
    <Pantalla titulo="Ajustes" volverA="/mas">
      <div className="space-y-4">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            setListo(false)
            if (!(await enviar(() => guardarIndicativo(indicativo), e))) return
            // Se muestra tal como quedó guardado (solo números).
            setIndicativo(indicativo.replace(/\D/g, ''))
            setListo(true)
          }}
        >
          <Campo etiqueta="Indicativo de país para WhatsApp" error={mensajeDe(errores, 'indicativo')}>
            <input
              inputMode="numeric"
              className={claseEntrada}
              value={indicativo}
              onChange={(e) => {
                setIndicativo(e.target.value)
                setListo(false)
              }}
              placeholder="57"
            />
          </Campo>
          <p className="text-sm text-tenue">
            Se agrega al teléfono del cliente al abrir WhatsApp. Colombia es 57. Si guardas un teléfono empezando por +, se
            respeta tal cual.
          </p>
          <Boton type="submit" disabled={enviando || indicativo === guardado}>
            Guardar
          </Boton>
          {listo && (
            <p role="status" className="text-center text-sm font-medium text-exito">
              Guardado
            </p>
          )}
        </form>

        <Tarjeta>
          <dl className="space-y-3">
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-tenue">Versión</dt>
              <dd className="font-medium">{version}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-sm text-tenue">Datos protegidos en este dispositivo</dt>
              <dd className="font-medium">{protegido === null ? '…' : protegido ? 'Sí' : 'No'}</dd>
            </div>
          </dl>
          {protegido === false && (
            <p className="mt-3 text-sm text-tenue">
              El navegador podría borrar los datos si le falta espacio o si pasas mucho tiempo sin abrir la app. Instálala en la
              pantalla de inicio y haz copias de seguridad con frecuencia.
            </p>
          )}
        </Tarjeta>
      </div>
    </Pantalla>
  )
}
