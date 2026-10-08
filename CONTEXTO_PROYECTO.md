# CONTEXTO DEL PROYECTO — Mis Ventas

> Documento de continuidad. Si abres este proyecto en otro computador o en una
> conversación nueva con Claude, entrega este archivo primero: describe el
> negocio, las decisiones tomadas y el estado actual.

**Última actualización:** 2026-10-07
**Versión:** 0.1.0 (Etapa 0 terminada)

---

## 1. Estado actual

| Etapa | Contenido | Estado |
|---|---|---|
| 0 | Proyecto base, documentación, tema visual, base de datos, PWA mínima | **Terminada** |
| 1 | Dominio completo con pruebas (sin pantallas) | **Siguiente** |
| 2 | Marcas, campañas y clientes | Pendiente |
| 3 | Nuevo pedido, detalle del pedido y abonos | Pendiente |
| 4 | Dashboard, filtros y búsqueda | Pendiente |
| 5 | Reportes, detalle de campaña, historial y WhatsApp | Pendiente |
| 6 | Copia de seguridad, restauración y CSV | Pendiente |
| 7 | Pulido offline, prueba en iPhone, versión 1.0 | Pendiente |

**Funciones implementadas (Etapa 0):**

- Proyecto Vite + React + TypeScript que compila a producción.
- Tema oscuro y componentes base (`Pantalla`, `Tarjeta`, `EstadoVacio`).
- Barra inferior Inicio · Pedidos · ＋ · Clientes · Más, con el menú "Más"
  completo. Las pantallas son marcadores vacíos: todavía no guardan ni
  muestran datos.
- Tipos de todas las entidades (`src/dominio/tipos.ts`).
- Base de datos Dexie con las siete tablas e índices (`src/datos/db.ts`).
- PWA: manifiesto, íconos y service worker; la app carga sin conexión.
- 5 pruebas de datos (Vitest) y 5 de flujos (Playwright), todas en verde.

**Todavía no existe:** cálculos, validaciones, repositorios, formularios, ni
ninguna función del negocio. Eso empieza en la Etapa 1.

**Pendientes fuera del código:**

- Primer commit de Git: falta configurar nombre y correo (`git config`).
- Repositorio privado en GitHub.
- Hosting con HTTPS para instalar en el iPhone (sección 13).
- Prueba en un iPhone real: hasta ahora solo se probó en Chrome con el tamaño
  de un iPhone 12 Pro Max.

---

## 2. Objetivo

Aplicación móvil personal para controlar un negocio de **venta de productos
por catálogo**. No es una aplicación de préstamos: el dinero pendiente
corresponde a ventas realizadas.

Debe responder rápido desde el celular:

- ¿Cuánto vendí? ¿Cuánto he cobrado? ¿Cuánto me deben?
- ¿Quién me debe? ¿Qué compró? ¿Cuánto ha pagado? ¿Cuánto le falta?
- ¿Cuánto me deben de una marca o de una campaña específica?

Prioridades, en orden: estabilidad, simplicidad, velocidad, facilidad de uso,
protección de los datos, facilidad para continuar el proyecto.

---

## 3. Cómo funciona el negocio

- El negocio vende productos de varias **marcas** (Ésika, Novaventa, Marketing y
  otras que se agreguen).
- Cada marca trabaja por **campañas** (catálogos). Una campaña siempre
  pertenece a una marca: "Ésika → Campaña 10" y "Novaventa → Campaña 10" son
  campañas distintas y nunca se mezclan.
- Un **cliente** hace **pedidos**. Cada pedido pertenece a una marca y una
  campaña, y contiene uno o varios **productos**.
- El cliente puede pagar todo, una parte o nada. Cada pago es un **abono**.
- El **saldo pendiente** es lo que falta por pagar de un pedido.

Estructura conceptual:

```
MARCA → CAMPAÑA → CLIENTE → PEDIDO → PRODUCTOS → ABONOS → SALDO
```

Ejemplo de referencia (se usa en las pruebas):

```
Pedido #0001 · María López · Ésika — Campaña 10
  1 × Perfume  $120.000 = $120.000
  1 × Base     $80.000  = $80.000
  2 × Labial   $35.000  = $70.000
  TOTAL                   $270.000
Abono $100.000 → saldo $170.000 → PAGO PARCIAL
Abono $70.000  → saldo $100.000 → PAGO PARCIAL
Abono $100.000 → saldo $0       → PAGADO
```

**Vocabulario obligatorio:** pedido, abono, saldo pendiente.
**No usar:** deuda, préstamo.

---

## 4. Tecnología

| Pieza | Elección | Motivo |
|---|---|---|
| Tipo de app | PWA instalable | Un solo código para iPhone y Android, sin tiendas |
| Base | Vite + React + TypeScript | Estable, fácil de mantener |
| Almacenamiento | IndexedDB con Dexie | Transacciones, índices, capacidad para miles de registros |
| Estilos | Tailwind CSS | Tema oscuro y diseño móvil consistente |
| PWA | vite-plugin-pwa (Workbox) | Instalación y modo offline |
| Pruebas | Vitest + fake-indexeddb; Playwright | Lógica y datos; flujos completos y offline |
| Versiones | Git (repositorio privado en GitHub) | Continuar desde otro computador |

Sin backend, sin login, sin base de datos online. Los datos del negocio viven
únicamente en el teléfono.

**Por qué no localStorage:** límite de ~5 MB, sin índices ni transacciones, y
un fallo a mitad de escritura puede dañar todos los datos.

---

## 5. Arquitectura

Tres capas con dependencias en un solo sentido: interfaz → datos → dominio.

| Capa | Carpeta | Responsabilidad | Regla |
|---|---|---|---|
| Dominio | `src/dominio` | Tipos, cálculos, estados, validaciones, reportes, historial, mensaje de WhatsApp | Funciones puras. No conoce React ni IndexedDB |
| Datos | `src/datos` | Base de datos Dexie, repositorios, copia de seguridad, CSV | Único lugar que toca el almacenamiento |
| Interfaz | `src/pantallas`, `src/ui`, `src/app` | Pantallas, componentes, navegación | Nunca calcula saldos ni valida reglas: llama al dominio |

La interfaz lee con consultas reactivas de Dexie (`useLiveQuery`): al guardar
un abono, todas las pantallas que muestran ese pedido se actualizan solas. No
hay gestor de estado global.

Una futura sincronización en la nube solo cambiaría la capa de datos.

---

## 6. Estructura de carpetas

```
mis-ventas/
├─ README.md
├─ CONTEXTO_PROYECTO.md
├─ CHANGELOG.md
├─ index.html
├─ package.json  vite.config.ts  tsconfig.json  playwright.config.ts
├─ public/iconos/          íconos de la PWA (generados)
├─ scripts/                generar-iconos.mjs
├─ src/
│  ├─ dominio/
│  │  ├─ tipos.ts          entidades
│  │  ├─ dinero.ts         formato y lectura de pesos
│  │  ├─ fechas.ts         fechas AAAA-MM-DD
│  │  ├─ calculos.ts       subtotal, total, abonado, saldo
│  │  ├─ estados.ts        estado de pago y vencimiento
│  │  ├─ validaciones.ts   pedido, producto, abono, edición
│  │  ├─ reportes.ts       vendido / cobrado / pendiente por dimensión
│  │  ├─ historial.ts      movimientos derivados
│  │  ├─ busqueda.ts       búsqueda y filtros de pedidos
│  │  └─ whatsapp.ts       mensaje de resumen
│  ├─ datos/
│  │  ├─ db.ts             esquema Dexie y versiones
│  │  ├─ repositorios/     marcas, campanas, clientes, pedidos, abonos
│  │  └─ respaldo/         exportar, validar, restaurar, csv
│  ├─ ui/                  componentes reutilizables
│  ├─ pantallas/           inicio, pedidos, clientes, campanas, mas
│  └─ app/                 rutas, barra inferior, tema
└─ e2e/                    pruebas Playwright
```

Las pruebas unitarias viven junto al archivo que prueban (`calculos.test.ts`).
Los nombres de archivos y carpetas no llevan tildes ni ñ.

---

## 7. Modelo de datos

Todos los `id` son UUID. El dinero se guarda en **enteros** (pesos, sin
decimales). Las fechas de negocio son texto `AAAA-MM-DD`; las marcas de tiempo
de creación son ISO completas.

### marcas
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| nombre | texto | Único |
| activa | sí/no | Una marca inactiva no aparece al crear pedidos |
| creadaEn | fecha-hora | |

### campanas
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| marcaId | texto | Obligatorio |
| nombre | texto | Único **dentro de su marca** |
| fechaInicio | fecha, opcional | |
| fechaCierre | fecha, opcional | |
| estado | `abierta` \| `cerrada` | En la V1 siempre `abierta` |
| notas | texto, opcional | |
| creadaEn | fecha-hora | |

### clientes
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| nombre | texto | Obligatorio |
| telefono | texto | |
| notas | texto | |
| estado | `activo` \| `archivado` | |
| creadoEn | fecha-hora | |

### pedidos
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| numero | entero | Consecutivo global, nunca se reutiliza |
| clienteId | texto | Obligatorio |
| marcaId | texto | Debe coincidir con la marca de la campaña |
| campanaId | texto | Obligatorio |
| fecha | fecha | Fecha de venta |
| fechaLimite | fecha, opcional | |
| notas | texto | |
| creadoEn | fecha-hora | |

### items (productos del pedido)
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| pedidoId | texto | |
| nombre | texto | Obligatorio |
| cantidad | entero | Mayor que 0 |
| valorUnitario | entero | 0 o más |
| productoId | texto, opcional | Reservado para el catálogo futuro |
| costoUnitario | entero, opcional | Reservado para ganancias futuras |

### abonos
| Campo | Tipo | Notas |
|---|---|---|
| id | texto | |
| pedidoId | texto | |
| valor | entero | Mayor que 0 y no mayor que el saldo |
| fecha | fecha | |
| metodo | `efectivo` \| `nequi` \| `transferencia` \| `otro` | |
| nota | texto, opcional | |
| creadoEn | fecha-hora | Desempata abonos del mismo día |

### meta
Pares clave/valor: `ultimoNumeroPedido`, `versionEsquema`, `ultimaCopia`,
`indicativoPais` (por defecto `57`).

### Relaciones
- Marca → muchas campañas
- Campaña → muchos pedidos
- Cliente → muchos pedidos
- Pedido → muchos items y muchos abonos

**No existen como campos:** subtotal, total, total abonado, saldo, estado del
pedido. Siempre se calculan.

---

## 8. Reglas de negocio

### Cálculos
- Subtotal del producto = cantidad × valor unitario.
- Total del pedido = suma de subtotales.
- Total abonado = suma de abonos.
- **Saldo = total − total abonado. Nunca se guarda.**

### Estado del pedido (calculado)
- **Pendiente:** total abonado = 0.
- **Pago parcial:** total abonado > 0 y saldo > 0.
- **Pagado:** saldo = 0.
- **Vencido:** es una marca adicional, no reemplaza al estado. Aplica cuando
  hay fecha límite, hoy es posterior a ella y el saldo es mayor que 0. Un
  pedido vencido sigue mostrando cuánto se ha abonado.

### Número de pedido
Contador global en `meta`. Se incrementa en la misma transacción que crea el
pedido. Eliminar un pedido no devuelve su número. Se muestra como `#0001`.

### Validaciones (todas en `src/dominio/validaciones.ts`, con pruebas)
- Pedido: requiere cliente, marca, campaña y al menos un producto. La campaña
  debe pertenecer a la marca.
- Producto: nombre obligatorio, cantidad > 0, valor unitario ≥ 0.
- Abono: valor > 0, valor ≤ saldo, fecha válida, método obligatorio.
- **Edición de pedido con abonos:** el nuevo total no puede ser menor que el
  total abonado. Aumentar el total siempre se permite.
- Fechas: deben ser fechas reales; la fecha límite no puede ser anterior a la
  fecha de venta.

### Eliminar y archivar
- **Cliente:** se archiva, no se elimina. Solo puede eliminarse un cliente sin
  pedidos. Un cliente archivado conserva pedidos y abonos, sigue contando en
  los totales y no aparece al crear pedidos. Se avisa si se archiva con saldo.
- **Marca y campaña:** no se eliminan si tienen pedidos. La marca se desactiva.
- **Pedido, producto y abono:** se eliminan con confirmación. Si el pedido
  tiene abonos, la advertencia indica cuántos y por cuánto valor.
- Eliminar un producto de un pedido pasa por la misma validación de edición.

### Campaña cerrada (futuro)
El campo `estado` ya existe. Cuando se implemente el cierre, las operaciones
de escritura sobre pedidos de una campaña cerrada deberán rechazarse desde la
capa de dominio. En la V1 no hay forma de cerrar una campaña.

### Historial (derivado, no se guarda)
- **Venta registrada:** uno por pedido, en su fecha.
- **Abono recibido:** uno por abono.
- **Venta pagada:** en la fecha del abono que dejó el saldo en $0.

Las ediciones no generan movimientos en la V1.

### Reportes
Vendido, cobrado y pendiente por: todo el negocio, marca, campaña, cliente y
mes. Un único motor en `reportes.ts` agrupa por la dimensión pedida, de modo
que agregar "método de pago" más adelante sea una dimensión más.

- "Vendido" de un mes: pedidos cuya fecha de venta cae en ese mes.
- "Cobrado" de un mes: abonos cuya fecha cae en ese mes.

---

## 9. Navegación y pantallas

Barra inferior: **Inicio · Pedidos · ＋ · Clientes · Más**

El botón ＋ central abre "Nuevo pedido" desde cualquier pantalla.

| Pantalla | Contenido |
|---|---|
| Inicio | Total por cobrar; clientes con saldo, pedidos pendientes, pedidos pagados; este mes; mayores saldos; pendientes recientes |
| Pedidos | Buscador; filtros Todas / Pendientes / Pago parcial / Vencidas / Pagadas; filtros por marca, campaña, cliente y fechas |
| Nuevo / editar pedido | Cliente (buscar o crear), marca, campaña de esa marca, productos, abono inicial con método, fechas, notas; resumen Total / Abono / Saldo fijo abajo |
| Detalle del pedido | Datos, productos, total, abonado, saldo, estado, historial de abonos, registrar abono |
| Registrar abono | Saldo actual, valor, fecha, método, nota |
| Clientes | Lista con comprado, pagado y saldo; activos y archivados |
| Detalle del cliente | Sus pedidos, total pendiente, WhatsApp, archivar |
| Más | Acceso a las siguientes |
| Historial | Movimientos derivados |
| Reportes | Vendido / cobrado / pendiente por dimensión |
| Marcas | Crear, editar, activar o desactivar; resumen por marca |
| Campañas | Lista por marca |
| Detalle de campaña | Vendido, cobrado, pendiente, n.º de clientes, n.º de pedidos, pendientes, pagados; sus clientes y pedidos |
| Copia de seguridad | Exportar, restaurar, CSV, fecha de la última copia |
| Ajustes | Indicativo de país para WhatsApp, versión de la app |

### Diseño
Tema oscuro, tarjetas, bordes redondeados, animaciones suaves, pensado para
una mano en iPhone 12 Pro Max (428 × 926 puntos) y compatible con Android.
Respeta las zonas seguras de iOS (muesca y barra inferior). Los formularios
aparecen como hojas inferiores, no como páginas web.

---

## 10. Almacenamiento

- IndexedDB mediante Dexie, base `mis-ventas`.
- Índices previstos: `campanas.marcaId`, `pedidos.numero`, `pedidos.clienteId`,
  `pedidos.marcaId`, `pedidos.campanaId`, `pedidos.fecha`, `items.pedidoId`,
  `abonos.pedidoId`, `abonos.fecha`.
- Toda operación que toca varias tablas (crear pedido con productos y abono
  inicial, eliminar pedido, restaurar copia) va en una sola transacción.
- Los cambios de esquema se hacen con versiones de Dexie y su migración.
- Al abrir, la app pide almacenamiento persistente al navegador.

**Riesgo conocido en iOS:** Safari puede borrar datos de sitios no usados en
7 días. Las PWA instaladas en la pantalla de inicio están exentas. Aun así, la
copia de seguridad es la protección real.

---

## 11. Copia de seguridad

### Formato
Un archivo `mis-ventas-AAAA-MM-DD.json`:

```
{
  "app": "mis-ventas",
  "formato": 1,
  "versionEsquema": 1,
  "exportadoEn": "2026-10-07T15:00:00Z",
  "datos": { "marcas": [], "campanas": [], "clientes": [],
             "pedidos": [], "items": [], "abonos": [], "meta": [] }
}
```

### Restauración
1. Leer el archivo y comprobar que es JSON válido.
2. Comprobar que es de esta app y que el formato es compatible.
3. Validar cada registro (campos obligatorios y tipos).
4. Validar las relaciones: toda campaña apunta a una marca que existe, todo
   pedido a un cliente y una campaña que existen, todo item y abono a un
   pedido que existe; números de pedido sin repetir; contador ≥ número mayor.
5. Mostrar un resumen: cuántas marcas, campañas, clientes, pedidos y abonos
   trae la copia, su fecha, y cuántos datos actuales se reemplazarán.
6. Pedir confirmación.
7. Reemplazar todo dentro de **una sola transacción**. Si algo falla, los
   datos actuales quedan intactos.

Si la copia es inválida en cualquier paso, no se toca nada.

### CSV
Exportación de pedidos, productos y abonos, pensada para abrirse en Excel.

### Cómo mover los datos a otro teléfono
> Se completará con capturas y pasos exactos cuando se implemente la Etapa 6.

1. En el teléfono viejo: Más → Copia de seguridad → Exportar copia completa.
2. Guardar el archivo en Archivos / iCloud / Google Drive, o enviarlo por
   WhatsApp o correo a uno mismo.
3. En el teléfono nuevo: instalar Mis Ventas (sección 13).
4. Más → Copia de seguridad → Restaurar copia → elegir el archivo.
5. Revisar el resumen y confirmar.

Los datos **no** viajan con Git ni con el código: solo con este archivo.

---

## 12. Pruebas

| Nivel | Herramienta | Qué cubre |
|---|---|---|
| Dominio | Vitest | Subtotales, total, saldo, estados, vencimiento, validaciones, edición con abonos, reportes, historial, búsqueda, filtros, mensaje de WhatsApp |
| Datos | Vitest + fake-indexeddb | Crear marca, campaña, cliente y pedido; consecutivo que no se reutiliza; abonos; exportar, validar y restaurar; copia inválida no altera datos |
| Flujos | Playwright (tamaño iPhone) | Crear pedido completo, registrar abonos hasta pagar, filtrar, buscar, restaurar, uso sin conexión |

Comandos:

```
npm test          pruebas de dominio y datos
npm run e2e       pruebas de flujos (compila y levanta la app sola)
```

Las pruebas de flujos usan el **Google Chrome instalado** en el computador
(`channel: 'chrome'` en `playwright.config.ts`). No hace falta ejecutar
`npx playwright install`: en el computador inicial, el Control de aplicaciones
de Windows bloquea el navegador que descarga Playwright.

---

## 13. Ejecutar, generar producción e instalar

```
npm install       instalar dependencias (una vez)
npm run dev       abrir en desarrollo
npm run build     generar producción en dist/
npm run preview   probar la versión de producción
npm run iconos    regenerar los íconos de la PWA
```

Versiones usadas al crear el proyecto: Node 24, Vite 8, React 19,
TypeScript 7, Tailwind 4, Dexie 4, Vitest 5, Playwright 1.64.

**Probar en el iPhone durante el desarrollo:** computador y teléfono en la
misma WiFi, `npm run dev -- --host`, y abrir en Safari la dirección de red que
muestra la terminal. Sirve para diseño y flujos; no permite instalar ni probar
offline, porque eso exige HTTPS.

**Publicación:** la carpeta `dist/` se sube a un hosting estático gratuito con
HTTPS (Cloudflare Pages o GitHub Pages). El hosting solo entrega los archivos
de la app; los datos nunca salen del teléfono. Pendiente de configurar.

**Instalar en iPhone:** abrir la dirección en Safari → Compartir → "Agregar a
pantalla de inicio".

**Instalar en Android:** abrir la dirección en Chrome → menú → "Instalar app".

---

## 14. Continuar en otro computador

Requisitos: Git, Node.js LTS y Google Chrome (para las pruebas de flujos).

1. Clonar el repositorio (o copiar la carpeta `mis-ventas`).
2. `npm install`
3. `npm run dev`
4. Leer este archivo y `CHANGELOG.md`.

Para continuar con Claude: abrir la carpeta del proyecto, iniciar una
conversación y pedirle que lea `CONTEXTO_PROYECTO.md` antes de hacer nada.

**Pendiente:** crear el repositorio privado en GitHub y hacer el primer commit
(Git aún no tiene nombre ni correo configurados en el computador inicial).

**Ubicación en el computador inicial:** `C:\Proyectos\mis-ventas`. Está fuera
de OneDrive a propósito: OneDrive sincroniza mal las miles de dependencias de
`node_modules`.

---

## 15. Decisiones importantes

| Decisión | Motivo |
|---|---|
| PWA en lugar de app nativa | Cubre todo lo pedido con un solo código |
| IndexedDB con Dexie | Estabilidad y transacciones |
| Saldo y estado siempre calculados | Imposible que queden desincronizados |
| Dinero en enteros | Sin errores de redondeo |
| Fechas como `AAAA-MM-DD` | Un pedido no cambia de día por la zona horaria |
| Ids UUID | Preparado para sincronización futura |
| Historial derivado | Siempre coherente con pedidos y abonos |
| "Vencido" como marca adicional | No oculta cuánto se ha pagado |
| Clientes se archivan | Conserva el historial |
| ＋ en el centro de la barra | Alcance del pulgar en pantallas grandes |
| Proyecto fuera de OneDrive | Evita conflictos con `node_modules` |

---

## 16. Funciones futuras (no implementar todavía)

Cierre de campañas, reporte por método de pago, catálogo maestro de productos,
costos, ganancias y márgenes, inventario, recordatorios de cobro,
notificaciones, PIN, biometría, sincronización en la nube, varios
dispositivos, varios usuarios, productos favoritos, historial de precios.

Ya preparado en el modelo: `campanas.estado`, `abonos.metodo`,
`items.productoId`, `items.costoUnitario`, ids UUID.
