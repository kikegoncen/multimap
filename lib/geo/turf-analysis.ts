import * as turf from '@turf/turf';
import type { Establecimiento, EstablecimientoFeature } from '@/types/denue';

/** Análisis 6 — Buffers de influencia (100/250/500m) alrededor de un punto. */
export function buildBuffer(lng: number, lat: number, radiusMeters: number) {
  return turf.buffer(turf.point([lng, lat]), radiusMeters, { units: 'meters' });
}

/** Análisis 7 y 12 — competidores dentro de un radio, con distancias. */
export function competidoresEnRadio(
  origen: Establecimiento,
  candidatos: EstablecimientoFeature[],
  radiusMeters: number,
) {
  const puntoOrigen = turf.point([origen.lng, origen.lat]);
  const resultados: { establecimiento: Establecimiento; distanciaM: number }[] = [];

  for (const feature of candidatos) {
    const est = feature.properties;
    if (est.id === origen.id) continue;
    const d = turf.distance(puntoOrigen, turf.point([est.lng, est.lat]), { units: 'meters' });
    if (d <= radiusMeters) resultados.push({ establecimiento: est, distanciaM: Math.round(d) });
  }

  return resultados.sort((a, b) => a.distanciaM - b.distanciaM);
}

/** Análisis 7 — distancia al competidor más cercano (mismo giro). */
export function distanciaCompetidorMasCercano(
  origen: Establecimiento,
  mismosGiro: EstablecimientoFeature[],
): number | null {
  const otros = mismosGiro.filter((f) => f.properties.id !== origen.id);
  if (otros.length === 0) return null;

  const fc = turf.featureCollection(
    otros.map((f) => turf.point([f.properties.lng, f.properties.lat])),
  );
  const nearest = turf.nearestPoint(turf.point([origen.lng, origen.lat]), fc);
  return Math.round(turf.distance(turf.point([origen.lng, origen.lat]), nearest, { units: 'meters' }));
}

/** Análisis 5 — clustering DBSCAN sobre un conjunto de puntos (viewport actual). */
export function dbscanClusters(
  features: EstablecimientoFeature[],
  maxDistanceMeters: number,
  minPoints: number,
) {
  const fc = turf.featureCollection(
    features.map((f) =>
      turf.point([f.properties.lng, f.properties.lat], { id: f.properties.id }),
    ),
  );
  return turf.clustersDbscan(fc, maxDistanceMeters / 1000, { units: 'kilometers', minPoints });
}

/** Filtra features dentro del viewport actual (bbox) — usado antes de análisis pesados. */
export function featuresEnViewport(
  features: EstablecimientoFeature[],
  bbox: [number, number, number, number],
) {
  const bboxPoly = turf.bboxPolygon(bbox);
  return features.filter((f) =>
    turf.booleanPointInPolygon(turf.point([f.properties.lng, f.properties.lat]), bboxPoly),
  );
}
