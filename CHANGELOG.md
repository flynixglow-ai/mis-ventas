# Changelog

Todos los cambios importantes del proyecto se registran aquí.

## [0.4.0] — 2026-10-07 — Etapa 3: pedidos y abonos

### Agregado
- Nuevo pedido con varios productos, total automático y abono inicial con
  método de pago; selección o creación de cliente sin salir del formulario.
- Detalle del pedido con saldo, estado, productos e historial de abonos.
- Registrar abono (con atajo "Pagar todo") y eliminar abono.
- Editar y eliminar pedido, con advertencia cuando tiene abonos.
- Número de pedido consecutivo que no se reutiliza.
- Lista de pedidos; saldos en la lista y el detalle de clientes; total por
  cobrar en Inicio.
- Campo `orden` en los productos del pedido.
- 21 pruebas de repositorio y 4 pruebas de flujos (una sin conexión).

### Cambiado
- El botón Volver regresa a la pantalla anterior.

### Corregido
- Los productos de un pedido no conservaban el orden en que se escribieron.
- No se podía guardar un pedido con la fecha límite vacía.
  (Ambos detectados por las pruebas antes de cerrar la etapa.)

## [0.3.0] — 2026-10-07 — Etapa 2: marcas, campañas y clientes

### Agregado
- Pantalla Marcas: crear, editar, activar o desactivar y eliminar.
- Pantalla Campañas: agrupadas por marca, con fechas y notas opcionales.
- Pestaña Clientes: lista, búsqueda, detalle, edición, archivar, reactivar y
  eliminar (solo clientes sin pedidos).
- Repositorios de marcas, campañas y clientes sobre IndexedDB.
- Componentes de interfaz: hoja inferior, confirmación, campos, listas.
- 16 pruebas de repositorios y 4 pruebas de flujos.

### Cambiado
- Las secciones de "Más" pasan a rutas `/mas/...` y conservan la barra
  inferior.

### Corregido
- El formulario de cliente no guardaba al crear desde la pestaña Clientes
  (detectado por las pruebas de flujos antes de cerrar la etapa).

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
