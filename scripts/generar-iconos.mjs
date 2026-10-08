// Genera los íconos PNG de la PWA sin dependencias externas.
// Uso: npm run iconos
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'

const FONDO = [0x0b, 0x0d, 0x12]
const ACENTO = [0x7c, 0x6c, 0xff]
// Tres barras ascendentes, en coordenadas 0..1 dentro de la zona segura central.
const BARRAS = [
  { x: 0.3, alto: 0.2 },
  { x: 0.5, alto: 0.32 },
  { x: 0.7, alto: 0.44 },
]
const ANCHO_BARRA = 0.13
const BASE = 0.72

function dentroDeBarra(u, v) {
  const r = ANCHO_BARRA / 2
  return BARRAS.some(({ x, alto }) => {
    const dx = Math.abs(u - x)
    if (dx > r) return false
    const arriba = BASE - alto + r
    const abajo = BASE - r
    if (v >= arriba && v <= abajo) return true
    const cy = v < arriba ? arriba : abajo
    return dx * dx + (v - cy) * (v - cy) <= r * r
  })
}

function crc32(buf) {
  let c = ~0
  for (const b of buf) {
    c ^= b
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function bloque(tipo, datos) {
  const cuerpo = Buffer.concat([Buffer.from(tipo), datos])
  const largo = Buffer.alloc(4)
  largo.writeUInt32BE(datos.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(cuerpo))
  return Buffer.concat([largo, cuerpo, crc])
}

function png(tamano) {
  const MUESTRAS = 4
  const filas = Buffer.alloc(tamano * (1 + tamano * 3))
  let i = 0
  for (let y = 0; y < tamano; y++) {
    filas[i++] = 0
    for (let x = 0; x < tamano; x++) {
      let cubierto = 0
      for (let sy = 0; sy < MUESTRAS; sy++)
        for (let sx = 0; sx < MUESTRAS; sx++)
          if (dentroDeBarra((x + (sx + 0.5) / MUESTRAS) / tamano, (y + (sy + 0.5) / MUESTRAS) / tamano)) cubierto++
      const a = cubierto / (MUESTRAS * MUESTRAS)
      for (let c = 0; c < 3; c++) filas[i++] = Math.round(FONDO[c] * (1 - a) + ACENTO[c] * a)
    }
  }
  const cabecera = Buffer.alloc(13)
  cabecera.writeUInt32BE(tamano, 0)
  cabecera.writeUInt32BE(tamano, 4)
  cabecera.set([8, 2, 0, 0, 0], 8)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloque('IHDR', cabecera),
    bloque('IDAT', deflateSync(filas)),
    bloque('IEND', Buffer.alloc(0)),
  ])
}

const destino = new URL('../public/iconos/', import.meta.url)
mkdirSync(destino, { recursive: true })
const archivos = {
  'icono-192.png': 192,
  'icono-512.png': 512,
  'icono-512-maskable.png': 512,
  'apple-touch-icon.png': 180,
}
for (const [nombre, tamano] of Object.entries(archivos)) {
  writeFileSync(new URL(nombre, destino), png(tamano))
  console.log(`${nombre} (${tamano}px)`)
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0b0d12"/>${BARRAS.map(
  ({ x, alto }) =>
    `<rect x="${(x - ANCHO_BARRA / 2) * 100}" y="${(BASE - alto) * 100}" width="${ANCHO_BARRA * 100}" height="${alto * 100}" rx="${(ANCHO_BARRA / 2) * 100}" fill="#7c6cff"/>`,
).join('')}</svg>\n`
writeFileSync(new URL('favicon.svg', destino), svg)
console.log('favicon.svg')
