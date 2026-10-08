import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVistas } from '../datos/repositorios/consultas'
import { resumirDatos, validarCopia, type Copia, type ResumenDatos } from '../datos/respaldo/copia'
import { generarCsv } from '../datos/respaldo/csv'
import {
  CLAVE_ULTIMA_COPIA,
  crearCopia,
  leerDatosActuales,
  marcarCopiaHecha,
  nombreArchivoCopia,
  restaurarCopia,
} from '../datos/respaldo/respaldo'
import { formatearFecha, hoy } from '../dominio/fechas'
import { contar, formatearPesos } from '../dominio/formato'
import { Boton } from '../ui/Boton'
import { Hoja } from '../ui/Hoja'
import { Pantalla, Tarjeta } from '../ui/Pantalla'
import { diasDesde, entregarArchivos } from '../ui/archivos'

type Aviso = { tono: 'exito' | 'peligro'; titulo: string; detalles?: string[] }
type Revision = { nombre: string; copia: Copia; resumen: ResumenDatos }

export function textoUltimaCopia(iso: string | undefined): string {
  if (!iso) return 'Nunca'
  const dias = diasDesde(iso)
  if (dias === 0) return 'Hoy'
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`
}

const FILAS: [keyof ResumenDatos, string][] = [
  ['clientes', 'Clientes'],
  ['pedidos', 'Pedidos'],
  ['productos', 'Productos'],
  ['abonos', 'Abonos'],
  ['marcas', 'Marcas'],
  ['campanas', 'Campañas'],
]

export function CopiaSeguridad() {
  const selector = useRef<HTMLInputElement>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [revision, setRevision] = useState<Revision | null>(null)
  const [ocupado, setOcupado] = useState(false)

  const estado = useLiveQuery(async () => {
    const ultima = (await db.meta.get(CLAVE_ULTIMA_COPIA))?.valor
    return { ultima: typeof ultima === 'string' ? ultima : undefined, actual: resumirDatos(await leerDatosActuales()) }
  }, [])
  if (!estado) return null
  const { ultima, actual } = estado
  const vacio = actual.clientes + actual.pedidos + actual.marcas === 0

  async function conBloqueo(accion: () => Promise<void>) {
    if (ocupado) return
    setOcupado(true)
    setAviso(null)
    try {
      await accion()
    } catch (fallo) {
      console.error(fallo)
      setAviso({ tono: 'peligro', titulo: 'No se pudo completar la operación. Tus datos no se modificaron.' })
    } finally {
      setOcupado(false)
    }
  }

  const exportar = () =>
    conBloqueo(async () => {
      const copia = await crearCopia()
      const entrega = await entregarArchivos([
        { nombre: nombreArchivoCopia(), contenido: JSON.stringify(copia), tipo: 'application/json' },
      ])
      if (entrega === 'cancelado') return
      await marcarCopiaHecha()
      setAviso({
        tono: 'exito',
        titulo: 'Copia creada',
        detalles: ['Guárdala fuera de este teléfono: en iCloud, Google Drive o envíatela por WhatsApp o correo.'],
      })
    })

  const exportarCsv = () =>
    conBloqueo(async () => {
      const archivos = generarCsv(await cargarVistas(), hoy())
      await entregarArchivos(archivos.map((a) => ({ ...a, tipo: 'text/csv' })))
    })

  const revisar = (archivo: File) =>
    conBloqueo(async () => {
      // Paso 1 y 2: leer y validar. Aquí todavía no se toca ningún dato.
      const resultado = validarCopia(await archivo.text())
      if (!resultado.ok) {
        setAviso({
          tono: 'peligro',
          titulo: 'No se puede restaurar este archivo. Tus datos actuales no se modificaron.',
          detalles: resultado.errores,
        })
        return
      }
      // Paso 3: mostrar qué se va a importar y pedir confirmación.
      setRevision({ nombre: archivo.name, copia: resultado.copia, resumen: resultado.resumen })
    })

  const restaurar = (r: Revision) =>
    conBloqueo(async () => {
      setRevision(null)
      await restaurarCopia(r.copia)
      setAviso({ tono: 'exito', titulo: 'Copia restaurada', detalles: [`Ahora tienes ${contar(r.resumen.clientes, 'cliente', 'clientes')} y ${contar(r.resumen.pedidos, 'pedido', 'pedidos')}.`] })
    })

  return (
    <Pantalla titulo="Copia de seguridad" volverA="/mas">
      <div className="space-y-4">
        {aviso && (
          <div
            role={aviso.tono === 'peligro' ? 'alert' : 'status'}
            className={`rounded-tarjeta border p-4 ${
              aviso.tono === 'peligro' ? 'border-peligro/40 bg-peligro/10 text-peligro' : 'border-exito/40 bg-exito/10 text-exito'
            }`}
          >
            <p className="font-semibold">{aviso.titulo}</p>
            {aviso.detalles && (
              <ul className="mt-2 space-y-1 text-sm">
                {aviso.detalles.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Tarjeta>
          <p className="text-sm font-medium text-tenue">Última copia</p>
          <p aria-label="Última copia" className="mt-1 text-2xl font-bold">
            {textoUltimaCopia(ultima)}
          </p>
          <p className="mt-3 text-sm text-tenue">
            En este teléfono: {contar(actual.clientes, 'cliente', 'clientes')}, {contar(actual.pedidos, 'pedido', 'pedidos')} y{' '}
            {contar(actual.abonos, 'abono', 'abonos')}.
          </p>
        </Tarjeta>

        <div className="space-y-3">
          <Boton onClick={exportar} disabled={ocupado || vacio}>
            Exportar copia completa
          </Boton>
          <Boton variante="secundario" onClick={() => selector.current?.click()} disabled={ocupado}>
            Restaurar copia
          </Boton>
          <Boton variante="secundario" onClick={exportarCsv} disabled={ocupado || actual.pedidos === 0}>
            Exportar CSV para Excel
          </Boton>
          <input
            ref={selector}
            type="file"
            accept=".json,application/json"
            aria-label="Archivo de copia"
            className="hidden"
            onChange={(e) => {
              const archivo = e.target.files?.[0]
              // Se limpia para poder elegir el mismo archivo otra vez.
              e.target.value = ''
              if (archivo) void revisar(archivo)
            }}
          />
        </div>

        <Tarjeta className="text-sm text-tenue">
          <p className="font-semibold text-texto">Cambiar de teléfono</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>En el teléfono actual, exporta la copia completa y guárdala en la nube o envíatela.</li>
            <li>En el teléfono nuevo, instala Mis Ventas.</li>
            <li>Entra aquí, toca Restaurar copia y elige el archivo.</li>
          </ol>
          <p className="mt-3">Tus datos solo viven en este teléfono. Haz una copia cada semana.</p>
        </Tarjeta>
      </div>

      {revision && (
        <Hoja titulo="Restaurar copia" alCerrar={() => setRevision(null)}>
          <div className="space-y-4">
            <p className="text-sm text-tenue">
              {revision.nombre}
              {revision.copia.exportadoEn && ` · creada el ${formatearFecha(revision.copia.exportadoEn.slice(0, 10))}`}
            </p>
            <table aria-label="Qué se va a importar" className="w-full text-sm">
              <thead>
                <tr className="text-tenue">
                  <th className="pb-2 text-left font-medium" />
                  <th className="pb-2 text-right font-medium">En la copia</th>
                  <th className="pb-2 text-right font-medium">Ahora aquí</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {FILAS.map(([clave, etiqueta]) => (
                  <tr key={clave}>
                    <th className="py-2 text-left font-medium">{etiqueta}</th>
                    <td className="py-2 text-right font-semibold">{revision.resumen[clave]}</td>
                    <td className="py-2 text-right text-tenue">{actual[clave]}</td>
                  </tr>
                ))}
                <tr>
                  <th className="py-2 text-left font-medium">Por cobrar</th>
                  <td className="py-2 text-right font-semibold">{formatearPesos(revision.resumen.porCobrar)}</td>
                  <td className="py-2 text-right text-tenue">{formatearPesos(actual.porCobrar)}</td>
                </tr>
              </tbody>
            </table>
            <p className="rounded-2xl border border-aviso/40 bg-aviso/10 px-4 py-3 text-sm text-aviso">
              {vacio
                ? 'Se cargarán los datos de la copia en este teléfono.'
                : 'Todos los datos que hay ahora en este teléfono se reemplazarán por los de la copia. No se puede deshacer.'}
            </p>
            <Boton variante={vacio ? 'primario' : 'peligro'} onClick={() => restaurar(revision)}>
              {vacio ? 'Restaurar' : 'Reemplazar mis datos'}
            </Boton>
            <Boton variante="secundario" onClick={() => setRevision(null)}>
              Cancelar
            </Boton>
          </div>
        </Hoja>
      )}
    </Pantalla>
  )
}
