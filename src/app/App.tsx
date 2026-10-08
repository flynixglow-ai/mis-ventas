import { Navigate, Route, Routes } from 'react-router-dom'
import { ConBarra } from './ConBarra'
import { Inicio } from '../pantallas/Inicio'
import { Pedidos } from '../pantallas/Pedidos'
import { NuevoPedido } from '../pantallas/NuevoPedido'
import { Clientes } from '../pantallas/Clientes'
import { Mas, SECCIONES_MAS } from '../pantallas/Mas'
import { EnConstruccion } from '../pantallas/EnConstruccion'

export function App() {
  return (
    <div className="mx-auto h-full max-w-md bg-fondo">
      <Routes>
        <Route element={<ConBarra />}>
          <Route index element={<Inicio />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="mas" element={<Mas />} />
        </Route>
        <Route path="pedidos/nuevo" element={<NuevoPedido />} />
        {SECCIONES_MAS.map((s) => (
          <Route key={s.ruta} path={s.ruta} element={<EnConstruccion titulo={s.titulo} volverA="/mas" />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
