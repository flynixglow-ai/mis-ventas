# Mis Ventas

Aplicación móvil personal (PWA) para controlar un negocio de venta de productos
por catálogo: marcas, campañas, clientes, pedidos, abonos y saldos pendientes.

Funciona sin internet y guarda los datos en el propio teléfono.

## Estado

Versión 0.2.0 — Etapas 0 y 1 terminadas: base del proyecto, navegación, base
de datos, PWA y toda la lógica del negocio con pruebas. Las pantallas con
datos empiezan en la Etapa 2. Ver [CONTEXTO_PROYECTO.md](CONTEXTO_PROYECTO.md) para el estado detallado.

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
