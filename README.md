# Mis Ventas

Aplicación móvil personal (PWA) para controlar un negocio de venta de productos
por catálogo: marcas, campañas, clientes, pedidos, abonos y saldos pendientes.

Funciona sin internet y guarda los datos en el propio teléfono.

**Abrir la app:** https://flynixglow-ai.github.io/mis-ventas/

## Estado

Versión 0.9.0 — Todas las funciones de la V1 están implementadas: marcas,
campañas, clientes, pedidos con varios productos, abonos, dashboard, filtros,
búsqueda, reportes, historial, WhatsApp y copia de seguridad. Ver [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md) para el estado detallado.

## Documentación

- [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md): negocio, arquitectura, modelo
  de datos, reglas, decisiones y cómo continuar el proyecto.
- [CHANGELOG.md](CHANGELOG.md): versiones y cambios.

## Requisitos

- Node.js LTS
- Git
- Google Chrome (para las pruebas de flujos)

## Uso

```
npm install
npm run dev
npm test
npm run e2e
npm run build
```

## Tecnología

Vite, React, TypeScript, Dexie (IndexedDB), Tailwind CSS, vite-plugin-pwa,
Vitest y Playwright.
