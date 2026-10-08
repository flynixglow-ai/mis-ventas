import { Link } from 'react-router-dom'
import { resumirPedido, type ResumenPedido } from '../dominio/calculos'
import { ETIQUETA_ESTADO, type EstadoPago } from '../dominio/estados'
import { formatearNumeroPedido, formatearPesos } from '../dominio/formato'
import { ETIQUETA_METODO, METODOS_PAGO, type Fecha, type PedidoVista } from '../dominio/tipos'
import { Insignia, claseEntrada } from './Campo'

const TONO: Record<EstadoPago, 'aviso' | 'acento' | 'exito'> = {
  pendiente: 'aviso',
  parcial: 'acento',
  pagado: 'exito',
}

/** El estado de pago y, aparte, la marca de vencido: una no oculta a la otra. */
export function EstadoPedido({ resumen }: { resumen: ResumenPedido }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Insignia tono={TONO[resumen.estado]}>{ETIQUETA_ESTADO[resumen.estado]}</Insignia>
      {resumen.vencido && <Insignia tono="peligro">Vencido</Insignia>}
    </span>
  )
}

interface PropsTarjeta {
  vista: PedidoVista
  hoy: Fecha
  /** En el detalle de un cliente no hace falta repetir su nombre. */
  sinCliente?: boolean
}

export function TarjetaPedido({ vista, hoy, sinCliente }: PropsTarjeta) {
  const r = resumirPedido(vista, hoy)
  const numero = formatearNumeroPedido(vista.pedido.numero)
  return (
    <li>
      <Link
        to={`/pedidos/${vista.pedido.id}`}
        className="block rounded-tarjeta border border-borde bg-superficie p-4 active:bg-superficie-2"
      >
        <span className="flex items-start gap-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{sinCliente ? `Pedido ${numero}` : vista.cliente.nombre}</span>
            <span className="block truncate text-sm text-tenue">
              {!sinCliente && `${numero} · `}
              {vista.marca.nombre} — {vista.campana.nombre}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block font-semibold">{formatearPesos(r.total)}</span>
            {r.saldo > 0 && r.abonado > 0 && (
              <span className="block text-sm text-tenue">Pendiente {formatearPesos(r.saldo)}</span>
            )}
          </span>
        </span>
        <span className="mt-3 block">
          <EstadoPedido resumen={r} />
        </span>
      </Link>
    </li>
  )
}

export function EntradaDinero({
  valor,
  alCambiar,
  etiqueta,
}: {
  valor: number
  alCambiar: (valor: number) => void
  etiqueta?: string
}) {
  return (
    <input
      inputMode="numeric"
      autoComplete="off"
      aria-label={etiqueta}
      className={claseEntrada}
      placeholder="$0"
      value={valor > 0 ? formatearPesos(valor) : ''}
      onChange={(e) => alCambiar(Number(e.target.value.replace(/\D/g, '').slice(0, 12)))}
    />
  )
}

export function SelectorMetodo({ valor, alCambiar }: { valor: string; alCambiar: (metodo: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Método de pago" className="mt-1.5 grid grid-cols-2 gap-2">
      {METODOS_PAGO.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={valor === m}
          onClick={() => alCambiar(m)}
          className={`h-11 rounded-2xl border text-sm font-semibold transition-colors ${
            valor === m ? 'border-acento bg-acento/15 text-acento' : 'border-borde bg-superficie-2 text-tenue'
          }`}
        >
          {ETIQUETA_METODO[m]}
        </button>
      ))}
    </div>
  )
}
