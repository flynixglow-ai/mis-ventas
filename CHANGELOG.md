# Changelog

Todos los cambios importantes del proyecto se registran aquí.

## [0.1.0] — 2026-10-07 — Etapa 0: base del proyecto

### Agregado
- Proyecto Vite + React + TypeScript con Tailwind (tema oscuro).
- Barra inferior Inicio · Pedidos · ＋ · Clientes · Más y menú "Más" con
  Historial, Reportes, Marcas, Campañas, Copia de seguridad y Ajustes.
  Las pantallas son marcadores vacíos.
- Tipos de las entidades del negocio.
- Base de datos IndexedDB (Dexie) con siete tablas e índices.
- PWA: manifiesto, íconos generados por script y service worker offline.
- Pruebas: 5 de datos (Vitest + fake-indexeddb) y 5 de flujos (Playwright).

### Notas
- Las pruebas de flujos usan el Chrome instalado, porque Windows bloquea el
  navegador que descarga Playwright.
- Sin commit todavía: falta configurar nombre y correo de Git.

## [0.0.1] — 2026-10-07

### Agregado
- Carpeta del proyecto y repositorio Git.
- `README.md`, `CONTEXTO_PROYECTO.md` y `CHANGELOG.md`.
- Arquitectura, modelo de datos, reglas de negocio, navegación y plan de
  etapas definidos y documentados.

### Decidido
- Nombre provisional: Mis Ventas.
- Navegación: Inicio · Pedidos · ＋ · Clientes · Más.
- Campaña con pantalla de detalle propia y campo `estado` (abierta / cerrada).
- Clientes con estado activo / archivado en lugar de eliminación.
- Abonos con método de pago (efectivo, nequi, transferencia, otro).
