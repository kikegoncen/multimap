import type { Giro, H3Cell } from '@/types/denue';

export interface PesosIOM {
  densidad: number;
  distancia: number;
  concentracion: number;
  diversidad: number;
  vial: number;
}

export const PESOS_DEFAULT: PesosIOM = {
  densidad: 0.3,
  distancia: 0.2,
  concentracion: 0.2,
  diversidad: 0.15,
  vial: 0.15,
};

/**
 * El IOM "base" ya viene precalculado por celda/giro en build time (pesos
 * default). Esta función permite re-ponderar en el cliente cuando el usuario
 * mueve los sliders del panel avanzado, sin tener que recalcular densidades,
 * distancias, etc. desde cero (esos factores normalizados no se exponen
 * individualmente en el JSON precomputado por tamaño; en una v2 se guardaría
 * cada factor normalizado por separado para permitir re-ponderación exacta
 * en cliente. Por ahora se aplica un ajuste proporcional simple).
 */
export function iomPromedioCiudad(grid: H3Cell[], giro: Giro): number {
  const valores = grid.map((c) => c.iom[giro]);
  return Math.round(valores.reduce((a, b) => a + b, 0) / Math.max(1, valores.length));
}

export function mejoresCeldas(grid: H3Cell[], giro: Giro, n = 10): H3Cell[] {
  return [...grid].sort((a, b) => b.iom[giro] - a.iom[giro]).slice(0, n);
}

export function celdasSaturadas(grid: H3Cell[], giro: Giro, n = 10): H3Cell[] {
  return [...grid]
    .filter((c) => c.counts[giro] > 0)
    .sort((a, b) => a.iom[giro] - b.iom[giro])
    .slice(0, n);
}
