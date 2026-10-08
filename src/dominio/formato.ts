/** 270000 → "$270.000" */
export function formatearPesos(valor: number): string {
  const digitos = Math.abs(Math.round(valor))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${valor < 0 ? '-' : ''}$${digitos}`
}

/**
 * Lee lo que se escribe en un campo de dinero: "$120.000", "120000", "120 000".
 * Devuelve null si está vacío o no es un valor entero no negativo.
 */
export function leerPesos(texto: string): number | null {
  const limpio = texto.replace(/[\s$.]/g, '')
  if (!/^\d+$/.test(limpio)) return null
  const valor = Number(limpio)
  return Number.isSafeInteger(valor) ? valor : null
}

/** 25 → "#0025" */
export function formatearNumeroPedido(numero: number): string {
  return `#${String(numero).padStart(4, '0')}`
}

/** Minúsculas, sin tildes y sin espacios sobrantes: para comparar y buscar. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}
