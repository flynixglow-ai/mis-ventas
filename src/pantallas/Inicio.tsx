import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../datos/db'
import { cargarVistas } from '../datos/repositorios/consultas'
import { CLAVE_ULTIMA_COPIA } from '../datos/respaldo/respaldo'
import { formatearPesos } from '../dominio/formato'
import { calcularTotales } from '../dominio/reportes'
import { EstadoVacio, Pantalla, Tarjeta } from '../ui/Pantalla'
import { diasDesde } from '../ui/archivos'

/** Días sin copia a partir de los cuales Inicio lo recuerda. */
const DIAS_AVISO_COPIA = 7

export function Inicio() {
  const vistas = useLiveQuery(() => cargarVistas(), [])
  const ultimaCopia = useLiveQuery(async () => (await db.meta.get(CLAVE_ULTIMA_COPIA))?.valor ?? null, [])
  const totales = calcularTotales(vistas ?? [])

  const hayDatos = (vistas?.length ?? 0) > 0
  const sinCopiaReciente =
    ultimaCopia === null || (typeof ultimaCopia === 'string' && diasDesde(ultimaCopia) >= DIAS_AVISO_COPIA)

  return (
    <Pantalla titulo="Mis Ventas">
      <Tarjeta className="mb-4">
        <p className="text-sm font-medium text-tenue">Total por cobrar</p>
        <p aria-label="Total por cobrar" className="mt-1 text-[40px] font-bold leading-tight tracking-tight">
          {formatearPesos(totales.pendiente)}
        </p>
      </Tarjeta>
      {hayDatos && sinCopiaReciente && (
        <Link
          to="/mas/copia"
          className="mb-4 block rounded-tarjeta border border-aviso/40 bg-aviso/10 px-5 py-4 active:bg-aviso/20"
        >
          <span className="block font-semibold text-aviso">Haz una copia de seguridad</span>
          <span className="block text-sm text-tenue">
            {ultimaCopia === null
              ? 'Aún no has guardado ninguna copia de tus datos.'
              : `Tu última copia es de hace ${diasDesde(String(ultimaCopia))} días.`}
          </span>
        </Link>
      )}
      {vistas?.length === 0 && <EstadoVacio titulo="Aún no hay pedidos" detalle="Toca ＋ para registrar tu primera venta." />}
    </Pantalla>
  )
}
