# CONTEXTO DEL PROYECTO — Mis Ventas

> Documento de continuidad. Si abres este proyecto en otro computador o en una
> conversación nueva con Claude, entrega este archivo primero: describe el
> negocio, las decisiones tomadas y el estado actual.

**Última actualización:** 2026-10-07
**Versión:** 0.5.0 (Etapas 0 a 3 y 6 terminadas)

---

## 1. Estado actual

| Etapa | Contenido | Estado |
|---|---|---|
| 0 | Proyecto base, documentación, tema visual, base de datos, PWA mínima | **Terminada** |
| 1 | Dominio completo con pruebas (sin pantallas) | **Terminada** |
| 2 | Marcas, campañas y clientes | **Terminada** |
| 3 | Nuevo pedido, detalle del pedido y abonos | **Terminada** |
| 4 | Dashboard, filtros y búsqueda | **Siguiente** |
| 5 | Reportes, detalle de campaña, historial y WhatsApp | Pendiente |
| 6 | Copia de seguridad, restauración y CSV | **Terminada** (se adelantó) |
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

**Funciones implementadas (Etapa 1): toda la lógica del negocio, sin pantallas.**

| Archivo en `src/dominio` | Qué resuelve |
|---|---|
| `formato.ts` | Pesos (`$270.000`), lectura de campos de dinero, número `#0025`, normalizar texto |
| `fechas.ts` | Validar fechas, fecha de hoy, formato `07/10/2026`, mes |
| `calculos.ts` | Subtotal, total, abonado, saldo y `resumirPedido` |
| `estados.ts` | Pendiente / pago parcial / pagado, vencido, campaña cerrada |
| `validaciones.ts` | Marca, campaña, cliente, producto, abono, pedido nuevo y pedido editado |
| `reportes.ts` | Totales generales y por marca, campaña, cliente o mes; mayores saldos; pendientes recientes |
| `historial.ts` | Movimientos derivados: venta, abono, venta pagada |
| `busqueda.ts` | Filtros y búsqueda de pedidos y clientes |
| `whatsapp.ts` | Mensaje de resumen y enlace `wa.me` |

72 pruebas de dominio en verde. El escenario compartido por las pruebas está
en `src/dominio/datosDePrueba.ts` (4 pedidos, 2 clientes, 2 marcas).

**Funciones implementadas (Etapa 2): marcas, campañas y clientes.**

- **Marcas** (Más → Marcas): crear, renombrar, activar o desactivar, eliminar.
- **Campañas** (Más → Campañas): agrupadas por marca; crear con fechas y
  notas opcionales, editar, eliminar. La marca no cambia después de creada.
- **Clientes** (pestaña Clientes): crear, buscar por nombre o teléfono,
  detalle, editar, archivar, reactivar y eliminar (solo sin pedidos). La
  pestaña "Archivados" aparece únicamente cuando hay alguno.
- Repositorios en `src/datos/repositorios` (`marcas`, `campanas`, `clientes`):
  aplican las validaciones del dominio y lanzan `ErrorDeNegocio` con los
  mensajes para la interfaz.
- Componentes reutilizables en `src/ui`: `Boton`, `Campo`, `Interruptor`,
  `Insignia`, `Hoja` (hoja inferior), `Confirmar`, `Lista`, `Fila`,
  `useEnvio`.
- 16 pruebas de repositorios y 4 flujos nuevos en Playwright.

**Funciones implementadas (Etapa 3): pedidos y abonos. La app ya sirve para
el trabajo diario.**

- **Nuevo pedido** (botón ＋): cliente (buscar o crear sin salir), marca,
  campaña de esa marca, varios productos con subtotal, abono inicial con
  método de pago, fecha de venta, fecha límite y notas. Pie fijo con Total /
  Abono / Saldo. Propone la marca y campaña del último pedido.
- **Detalle del pedido:** saldo, total, abonado, estado, datos, productos,
  historial de abonos, editar y eliminar.
- **Registrar abono:** valor, atajo "Pagar todo", método, fecha y nota.
- **Editar pedido:** mismos campos; el total no puede bajar de lo abonado.
- **Eliminar** pedido, producto y abono con confirmación; si el pedido tiene
  abonos, la advertencia dice cuántos y por cuánto.
- **Pestaña Pedidos:** lista simple de todos los pedidos (sin filtros aún).
- **Clientes:** la lista muestra comprado, pagado y saldo; el detalle muestra
  sus pedidos, totales y un botón de nuevo pedido para ese cliente.
- **Inicio:** muestra el total por cobrar real (el resto del dashboard es de
  la Etapa 4).
- Repositorios `pedidos.ts` (crear, editar, eliminar, registrar y eliminar
  abono) y `consultas.ts` (`cargarVistas`, `cargarVista`).
- 21 pruebas de repositorio y 4 flujos nuevos, incluido uno sin conexión.

**Funciones implementadas (Etapa 6, adelantada): copia de seguridad.**

Se adelantó a las etapas 4 y 5 por decisión del 2026-10-08: poder respaldar
los datos era lo más urgente antes de usar la app con datos reales.

- **Más → Copia de seguridad:** exportar copia completa, restaurar copia y
  exportar CSV. Muestra hace cuánto fue la última copia.
- **Restaurar** valida el archivo completo, muestra una tabla "En la copia /
  Ahora aquí" y solo reemplaza tras confirmar. Un archivo inválido no toca
  nada y explica el problema.
- **Inicio** avisa cuando hay pedidos y no se ha hecho copia en 7 días.
- Código en `src/datos/respaldo`: `copia.ts` (formato y `validarCopia`, sin
  acceso a la base), `respaldo.ts` (`crearCopia`, `restaurarCopia`), `csv.ts`.
- `src/ui/archivos.ts`: en teléfonos usa el menú Compartir; en computador,
  descarga.
- 17 pruebas de respaldo y 4 flujos, incluido restaurar en una instalación
  vacía ("otro teléfono").

**Todavía no existe:** filtros y búsqueda en Pedidos, dashboard completo,
reportes, detalle de campaña, historial y WhatsApp (etapas 4 y 5). La lógica
de todo eso ya está en el dominio; faltan las pantallas.

**Pendiente crítico: hosting con HTTPS.** Sin él la app no se puede instalar
en el iPhone. Requiere una cuenta de GitHub o Cloudflare de la persona dueña
del proyecto (ver sección 13).

**Notas técnicas para quien continúe:**

- Las rutas de "Más" son `/mas/marcas`, `/mas/campanas`, etc., para que la
  pestaña Más quede resaltada. En `App.tsx`, el objeto `LISTAS` indica qué
  secciones ya están construidas; las demás muestran "Próximamente".
- `Hoja` y `Confirmar` usan un portal a `document.body`: las animaciones
  aplican `transform` y eso confinaría un `position: fixed`.
- Las funciones de los repositorios aceptan la base de datos como último
  parámetro opcional; las pruebas pasan una base temporal.
- Cuidado con `funcion?.(await algo())`: si `funcion` no existe, `algo()`
  no se ejecuta. Causó un error real en el formulario de cliente.
- Los formularios envían los campos opcionales vacíos como `''`. Los
  repositorios los convierten a `undefined` (`opcional()`) **antes** de
  validar; no hacerlo impedía guardar pedidos sin fecha límite.
- Los eventos de React suben por los portales: `Hoja` detiene el `submit`
  para que un formulario dentro de una hoja no envíe el de la pantalla.
- El botón Volver regresa a la pantalla anterior del historial
  (`useVolver`); la ruta `volverA` solo se usa si la app se abrió directamente
  en esa pantalla.
- El formulario de pedido (`FormularioPedido.tsx`) exporta `NuevoPedido` y
  `EditarPedido`; ocupa toda la pantalla, sin barra inferior.
- `/pedidos/nuevo?cliente=<id>` abre el formulario con ese cliente elegido.

**Pendientes fuera del código:**

- Repositorio privado en GitHub (Git local ya tiene commits).
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
│  │  ├─ formato.ts        pesos, número de pedido, normalizar texto
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
| orden | entero | Posición dentro del pedido |
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

### Convenciones del dominio
- Las validaciones devuelven una lista de `{ campo, mensaje }`; lista vacía
  significa válido. La interfaz muestra el mensaje junto al campo.
- Las funciones que dependen de la fecha reciben `hoy` como parámetro, para
  poder probarlas.
- Los reportes reciben `PedidoDetallado` (pedido + items + abonos); la búsqueda
  y WhatsApp reciben `PedidoVista` (además cliente, marca y campaña).
- "Pedidos pendientes" en totales = pedidos con saldo mayor que 0 (incluye los
  de pago parcial). El filtro "Pendientes" de la lista = sin ningún abono.
- El mensaje de WhatsApp agrupa por marca y campaña: dos pedidos del mismo
  cliente en la misma campaña se suman en un solo bloque.
- Un pedido de total $0 se considera pagado.

### Validaciones (todas en `src/dominio/validaciones.ts`, con pruebas)
- Pedido: requiere cliente, marca, campaña y al menos un producto. La campaña
  debe pertenecer a la marca.
- Producto: nombre obligatorio, cantidad > 0, valor unitario ≥ 0.
- Abono: valor > 0, valor ≤ saldo, fecha válida, método obligatorio.
- **Edición de pedido con abonos:** el nuevo total no puede ser menor que el
  total abonado. Aumentar el total siempre se permite.
- Fechas: deben ser fechas reales; la fecha límite no puede ser anterior a la
  fecha de venta.

### Abonos y edición
- El abono inicial se guarda con la fecha de la venta.
- Un abono no se edita: se elimina y se registra de nuevo.
- Al editar un pedido se reemplazan sus productos; número, abonos y fecha de
  creación se conservan.
- Un pedido antiguo de un cliente archivado se puede corregir, pero no se
  puede crear un pedido nuevo para un cliente archivado.

### Eliminar y archivar
- **Cliente:** se archiva, no se elimina. Solo puede eliminarse un cliente sin
  pedidos. Un cliente archivado conserva pedidos y abonos, sigue contando en
  los totales y no aparece al crear pedidos. Se avisa si se archiva con saldo.
- **Marca y campaña:** no se eliminan si tienen pedidos. La marca se desactiva.
  Al eliminar una marca sin pedidos se eliminan también sus campañas (la
  confirmación lo avisa).
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

Detalles de la implementación:

- La copia restaurada se "limpia": solo se conservan los campos conocidos.
- Si el consecutivo de la copia está atrasado, se corrige al mayor número de
  pedido, para no reutilizar números.
- Una copia con `formato` mayor que el de la app se rechaza con el mensaje
  "actualiza la aplicación".
- Si se cambia la estructura de los datos: subir `VERSION_ESQUEMA` en
  `db.ts`, subir `FORMATO_COPIA` en `copia.ts` y hacer que `validarCopia`
  convierta las copias antiguas. Nunca dejar de aceptar copias viejas.

### CSV
Tres archivos (`pedidos`, `productos`, `abonos`), separados por punto y coma
y con BOM, para que Excel en español los abra con columnas y tildes correctas.

### Cómo mover los datos a otro teléfono

**En el teléfono actual**

1. Abrir Mis Ventas → **Más** → **Copia de seguridad**.
2. Tocar **Exportar copia completa**. Se abre el menú Compartir.
3. Elegir dónde guardar el archivo `mis-ventas-AAAA-MM-DD.json`:
   - iPhone: **Guardar en Archivos** → iCloud Drive.
   - Android: **Drive** o **Guardar**.
   - O enviarlo a uno mismo por WhatsApp o correo.

**En el teléfono nuevo**

4. Instalar Mis Ventas (sección 13).
5. Tener el archivo a mano: en iCloud/Drive, o descargarlo del WhatsApp o
   correo a Archivos.
6. Abrir Mis Ventas → **Más** → **Copia de seguridad** → **Restaurar copia**.
7. Elegir el archivo. La app muestra cuántos clientes, pedidos y abonos trae
   y cuánto hay por cobrar.
8. Tocar **Restaurar**. Listo: mismos pedidos, mismos saldos, y la numeración
   continúa donde iba.

**Importante**

- Los datos **no** viajan con Git ni con el código: solo con este archivo.
- Desinstalar la app o borrar los datos de Safari/Chrome **borra los datos**.
  Antes de hacerlo, exportar una copia.
- Hacer una copia cada semana; Inicio lo recuerda a los 7 días.
- El archivo contiene nombres, teléfonos y ventas: guardarlo en un lugar
  privado.

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

**Pendiente:** crear el repositorio privado en GitHub y subir el proyecto.
Git está configurado solo dentro de este proyecto (correo
flynixglow@gmail.com); en otro computador hay que repetir `git config
user.name` y `git config user.email`.

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
