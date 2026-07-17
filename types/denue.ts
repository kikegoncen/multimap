/**
 * Tipos de dominio para Multimap.
 * Reflejan los campos reales del DENUE (INEGI) ya normalizados.
 */

export type Giro = 'farmacia' | 'cafeteria' | 'minisuper' | 'optica' | 'perfumeria';

export const GIRO_CONFIG: Record<
  Giro,
  { label: string; scian: string; color: string; icon: string }
> = {
  farmacia: { label: 'Farmacias', scian: '464111', color: '#5FA878', icon: 'pill' },
  cafeteria: { label: 'Cafeterías', scian: '722515', color: '#B07C4F', icon: 'coffee' },
  minisuper: { label: 'Tiendas de conveniencia', scian: '462112', color: '#4C8CA8', icon: 'shopping-cart' },
  optica: { label: 'Ópticas', scian: '464121', color: '#8C6FB0', icon: 'glasses' },
  perfumeria: { label: 'Perfumerías', scian: '465111', color: '#C4634A', icon: 'sparkles' },
};

export interface Establecimiento {
  id: string;
  nombre: string;
  giro: Giro;
  scian: string;
  personalOcupado: string;
  direccion: string;
  colonia: string;
  codigoPostal: string;
  alcaldia: string;
  lat: number;
  lng: number;
  fechaAlta: string;
}

/** Feature de un establecimiento en formato GeoJSON Point */
export interface EstablecimientoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Establecimiento;
}

export interface EstablecimientoCollection {
  type: 'FeatureCollection';
  features: EstablecimientoFeature[];
}

/** Celda de la grid H3 precomputada, con métricas de geomarketing */
export interface H3Cell {
  h3: string;
  lat: number;
  lng: number;
  counts: Record<Giro, number>;
  total: number;
  areaKm2: number;
  isc: number; // Índice de Saturación Comercial
  iscClase: ISCClase;
  iom: Record<Giro, number>; // Índice de Oportunidad Multimap, por giro (0-100)
}

export type ISCClase = 'Muy Baja' | 'Baja' | 'Media' | 'Alta' | 'Muy Alta';
export type IOMClase = 'Saturada' | 'Media' | 'Buena' | 'Excelente';

export function clasificarIOM(score: number): IOMClase {
  if (score < 40) return 'Saturada';
  if (score < 60) return 'Media';
  if (score < 80) return 'Buena';
  return 'Excelente';
}

export function colorIOM(score: number): string {
  if (score < 40) return '#C4634A';
  if (score < 60) return '#E0A94C';
  if (score < 80) return '#9BC17C';
  return '#5FA878';
}

export interface CiudadStats {
  totalPorGiro: Record<Giro, number>;
  totalGeneral: number;
  topColonias: { colonia: string; alcaldia: string; total: number }[];
  topAlcaldias: { alcaldia: string; total: number }[];
  altasPorAnio: { anio: string; total: number }[];
  alcaldiaMasSaturada: { alcaldia: string; isc: number };
  alcaldiaMayorOportunidad: { alcaldia: string; iom: number };
}
