import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { App } from './app/App'
import { db, pedirAlmacenamientoPersistente } from './datos/db'
import './estilos.css'

registerSW({ immediate: true })
void db.open()
void pedirAlmacenamientoPersistente()

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    {/* HashRouter: funciona en cualquier hosting estático sin configurar redirecciones. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
