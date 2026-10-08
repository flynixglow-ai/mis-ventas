import { Link } from 'react-router-dom'
import { Pantalla } from '../ui/Pantalla'
import { IconoAdelante } from '../ui/iconos'

export const SECCIONES_MAS = [
  { ruta: 'historial', titulo: 'Historial', detalle: 'Ventas y abonos registrados' },
  { ruta: 'reportes', titulo: 'Reportes', detalle: 'Vendido, cobrado y pendiente' },
  { ruta: 'marcas', titulo: 'Marcas', detalle: 'Ésika, Novaventa y las que agregues' },
  { ruta: 'campanas', titulo: 'Campañas', detalle: 'Resultados de cada campaña' },
  { ruta: 'copia', titulo: 'Copia de seguridad', detalle: 'Exportar y restaurar tus datos' },
  { ruta: 'ajustes', titulo: 'Ajustes', detalle: 'Preferencias de la aplicación' },
] as const

export function Mas() {
  return (
    <Pantalla titulo="Más">
      <ul className="overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        {SECCIONES_MAS.map((s, i) => (
          <li key={s.ruta} className={i > 0 ? 'border-t border-borde' : ''}>
            <Link to={`/${s.ruta}`} className="flex min-h-16 items-center gap-3 px-5 py-3 active:bg-superficie-2">
              <span className="flex-1">
                <span className="block font-semibold">{s.titulo}</span>
                <span className="block text-sm text-tenue">{s.detalle}</span>
              </span>
              <span className="text-tenue">
                <IconoAdelante />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Pantalla>
  )
}
