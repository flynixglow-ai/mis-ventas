# Changelog

Todos los cambios importantes del proyecto se registran aquí.

## [0.2.0] — 2026-10-07 — Etapa 1: dominio

### Agregado
- Cálculos: subtotal, total, total abonado y saldo (nunca se guarda).
- Estados calculados: pendiente, pago parcial, pagado; vencido como marca
  adicional.
- Validaciones de marca, campaña, cliente, producto, abono, pedido nuevo con
  abono inicial y pedido editado (el total no puede bajar de lo abonado).
- Reportes: totales generales y por marca, campaña, cliente y mes; clientes
  con mayor saldo; pendientes recientes.
- Historial derivado de pedidos y abonos.
- Filtros y búsqueda por cliente, producto, marca, campaña y número.
- Mensaje de resumen para WhatsApp y enlace con indicativo de país.
- Formato de pesos, fechas y número de pedido.
- 72 pruebas de dominio.
- `.gitattributes` para finales de línea uniformes entre computadores.

### Notas
- Nada de esta etapa es visible todavía en la app: es la lógica que usarán
  las pantallas de las etapas 2 a 6.

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
