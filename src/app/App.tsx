import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConBarra } from './ConBarra'
import { Inicio } from '../pantallas/Inicio'
import { Pedidos } from '../pantallas/Pedidos'
import { EditarPedido, NuevoPedido } from '../pantallas/FormularioPedido'
import { DetallePedido } from '../pantallas/DetallePedido'
import { Clientes } from '../pantallas/Clientes'
import { DetalleCliente } from '../pantallas/DetalleCliente'
import { Mas, SECCIONES_MAS } from '../pantallas/Mas'
import { Marcas } from '../pantallas/Marcas'
import { Campanas } from '../pantallas/Campanas'
import { CopiaSeguridad } from '../pantallas/CopiaSeguridad'
import { DetalleCampana } from '../pantallas/DetalleCampana'
import { Reportes } from '../pantallas/Reportes'
import { Historial } from '../pantallas/Historial'
import { Ajustes } from '../pantallas/Ajustes'
import { EnConstruccion } from '../pantallas/EnConstruccion'

// Secciones de "Más" ya construidas; el resto muestra "Próximamente".
const LISTAS: Record<string, ReactNode> = {
  marcas: <Marcas />,
  campanas: <Campanas />,
  copia: <CopiaSeguridad />,
  reportes: <Reportes />,
  historial: <Historial />,
  ajustes: <Ajustes />,
}

export function App() {
  return (
    <div className="mx-auto h-full max-w-md bg-fondo">
      <Routes>
        <Route element={<ConBarra />}>
          <Route index element={<Inicio />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="pedidos/:id" element={<DetallePedido />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<DetalleCliente />} />
          <Route path="mas" element={<Mas />} />
          <Route path="mas/campanas/:id" element={<DetalleCampana />} />
          {SECCIONES_MAS.map((s) => (
            <Route
              key={s.ruta}
              path={`mas/${s.ruta}`}
              element={LISTAS[s.ruta] ?? <EnConstruccion titulo={s.titulo} volverA="/mas" />}
            />
          ))}
        </Route>
        {/* El formulario de pedido ocupa toda la pantalla, con su propio pie fijo. */}
        <Route path="pedidos/nuevo" element={<NuevoPedido />} />
        <Route path="pedidos/:id/editar" element={<EditarPedido />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
