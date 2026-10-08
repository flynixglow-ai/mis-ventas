import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConBarra } from './ConBarra'
import { Inicio } from '../pantallas/Inicio'
import { Pedidos } from '../pantallas/Pedidos'
import { NuevoPedido } from '../pantallas/NuevoPedido'
import { Clientes } from '../pantallas/Clientes'
import { DetalleCliente } from '../pantallas/DetalleCliente'
import { Mas, SECCIONES_MAS } from '../pantallas/Mas'
import { Marcas } from '../pantallas/Marcas'
import { Campanas } from '../pantallas/Campanas'
import { EnConstruccion } from '../pantallas/EnConstruccion'

// Secciones de "Más" ya construidas; el resto muestra "Próximamente".
const LISTAS: Record<string, ReactNode> = {
  marcas: <Marcas />,
  campanas: <Campanas />,
}

export function App() {
  return (
    <div className="mx-auto h-full max-w-md bg-fondo">
      <Routes>
        <Route element={<ConBarra />}>
          <Route index element={<Inicio />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<DetalleCliente />} />
          <Route path="mas" element={<Mas />} />
          {SECCIONES_MAS.map((s) => (
            <Route
              key={s.ruta}
              path={`mas/${s.ruta}`}
              element={LISTAS[s.ruta] ?? <EnConstruccion titulo={s.titulo} volverA="/mas" />}
            />
          ))}
        </Route>
        <Route
          path="pedidos/nuevo"
          element={
            <div className="h-full overflow-y-auto">
              <NuevoPedido />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
