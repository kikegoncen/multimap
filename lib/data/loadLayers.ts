import type { EstablecimientoCollection, Giro, H3Cell, CiudadStats } from '@/types/denue';

const cache = new Map<string, unknown>();

async function fetchJSON<T>(url: string): Promise<T> {
  if (cache.has(url)) return cache.get(url) as T;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
  const data = (await res.json()) as T;
  cache.set(url, data);
  return data;
}

/** Carga el GeoJSON limpio de un giro (precomputado en build time, fase 1). */
export function loadGiroLayer(giro: Giro) {
  return fetchJSON<EstablecimientoCollection>(`/data/${giro}.geojson`);
}

/** Carga la grid H3 precomputada con ISC/IOM (fase 2). */
export function loadH3Grid() {
  return fetchJSON<H3Cell[]>('/data/h3-grid.json');
}

/** Carga los agregados de ciudad para el dashboard. */
export function loadCityStats() {
  return fetchJSON<CiudadStats>('/data/city-stats.json');
}
