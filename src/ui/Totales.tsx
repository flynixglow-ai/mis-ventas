import { Link } from 'react-router-dom'
import { formatearPesos } from '../dominio/formato'

interface Cifras {
  vendido: number
  cobrado: number
  pendiente: number
}

/** Vendido · Cobrado · Pendiente en tres columnas. */
export function TresCifras({ cifras, etiqueta }: { cifras: Cifras; etiqueta?: string }) {
  return (
    <dl aria-label={etiqueta} className="grid grid-cols-3 gap-2">
      <div>
        <dt className="text-xs text-tenue">Vendido</dt>
        <dd className="text-sm font-semibold">{formatearPesos(cifras.vendido)}</dd>
      </div>
      <div>
        <dt className="text-xs text-tenue">Cobrado</dt>
        <dd className="text-sm font-semibold">{formatearPesos(cifras.cobrado)}</dd>
      </div>
      <div>
        <dt className="text-xs text-tenue">Pendiente</dt>
        <dd className={`text-sm font-semibold ${cifras.pendiente > 0 ? 'text-aviso' : 'text-exito'}`}>
          {formatearPesos(cifras.pendiente)}
        </dd>
      </div>
    </dl>
  )
}

/** Una fila de reporte: título, detalle opcional y las tres cifras. */
export function FilaReporte({ titulo, detalle, cifras, a }: { titulo: string; detalle?: string; cifras: Cifras; a: string }) {
  return (
    <li>
      <Link to={a} className="block rounded-tarjeta border border-borde bg-superficie p-4 active:bg-superficie-2">
        <span className="block truncate font-semibold">{titulo}</span>
        {detalle && <span className="block truncate text-sm text-tenue">{detalle}</span>}
        <span className="mt-3 block">
          <TresCifras cifras={cifras} />
        </span>
      </Link>
    </li>
  )
}
