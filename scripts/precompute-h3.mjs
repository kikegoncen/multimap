/**
 * scripts/precompute-h3.mjs
 *
 * Fase 2 del pipeline de datos (ver §10 y §7.1 del documento de arquitectura).
 *
 * Genera una grid H3 (resolución 8, ~0.7 km² por celda) sobre el área de la
 * CDMX cubierta por los datos, y para cada celda precalcula:
 *   - conteo de establecimientos por giro
 *   - ISC (Índice de Saturación Comercial) = establecimientos / área_km²,
 *     clasificado por quintiles (Jenks natural breaks)
 *   - IOM (Índice de Oportunidad Multimap) 0-100 por giro, combinando:
 *       densidad (invertida), distancia al competidor más cercano (directa),
 *       concentración relativa de colonia (invertida), diversidad comercial
 *       del entorno (directa) y accesibilidad vial proxy (directa)
 *
 * Todo esto se hace UNA VEZ en build time -> el cliente sólo lee JSON estático.
 * Uso: node scripts/precompute-h3.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as h3 from 'h3-js';
import * as ss from 'simple-statistics';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'public', 'data');
const GIROS = ['farmacia', 'cafeteria', 'minisuper', 'optica', 'perfumeria'];
const H3_RES = 8;

function loadGiro(giro) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${giro}.geojson`), 'utf8'));
  return raw.features.map((f) => f.properties);
}

console.log('Cargando establecimientos limpios...');
const porGiro = Object.fromEntries(GIROS.map((g) => [g, loadGiro(g)]));
const todos = GIROS.flatMap((g) => porGiro[g]);
console.log(`Total: ${todos.length} establecimientos`);

// ---------------------------------------------------------------------------
// 1. Asignar celda H3 a cada establecimiento
// ---------------------------------------------------------------------------
for (const est of todos) {
  est.h3 = h3.latLngToCell(est.lat, est.lng, H3_RES);
}

// ---------------------------------------------------------------------------
// 2. Agrupar por celda H3
// ---------------------------------------------------------------------------
/** @type {Map<string, {counts: Record<string, number[]>}>} */
const cellMap = new Map();

for (const giro of GIROS) {
  for (const est of porGiro[giro]) {
    if (!cellMap.has(est.h3)) {
      cellMap.set(est.h3, { counts: Object.fromEntries(GIROS.map((g) => [g, 0])) });
    }
    cellMap.get(est.h3).counts[giro] += 1;
  }
}

const cellIds = [...cellMap.keys()];
console.log(`Celdas H3 (res ${H3_RES}) con al menos un establecimiento: ${cellIds.length}`);

// ---------------------------------------------------------------------------
// 3. Área de cada celda H3 (constante por resolución, en km²)
// ---------------------------------------------------------------------------
const AREA_KM2 = h3.cellArea(cellIds[0], 'km2');

// ---------------------------------------------------------------------------
// 4. ISC por celda + clasificación por quintiles (Jenks)
// ---------------------------------------------------------------------------
const totalesPorCelda = cellIds.map((id) => {
  const c = cellMap.get(id).counts;
  return GIROS.reduce((acc, g) => acc + c[g], 0);
});
const iscValues = totalesPorCelda.map((t) => t / AREA_KM2);
const jenksBreaks = ss.jenks(iscValues, 5); // 5 clases -> 6 cortes

function clasificarISC(valor) {
  const clases = ['Muy Baja', 'Baja', 'Media', 'Alta', 'Muy Alta'];
  for (let i = 0; i < clases.length; i++) {
    if (valor <= jenksBreaks[i + 1] || i === clases.length - 1) return clases[i];
  }
  return 'Media';
}

// ---------------------------------------------------------------------------
// 5. IOM por celda y por giro
//    factores: densidad(inv), distancia a competidor(dir), concentración de
//    colonia(inv), diversidad comercial(dir), accesibilidad vial proxy(dir)
// ---------------------------------------------------------------------------

// 5a. Distancia al competidor más cercano, por establecimiento (haversine simple)
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Para performance: comparar cada establecimiento sólo contra los de su celda
// H3 y las 6 celdas vecinas (kRing 1) del mismo giro.
for (const giro of GIROS) {
  const items = porGiro[giro];
  const byCell = new Map();
  for (const est of items) {
    if (!byCell.has(est.h3)) byCell.set(est.h3, []);
    byCell.get(est.h3).push(est);
  }
  for (const est of items) {
    const vecinos = h3.gridDisk(est.h3, 1).flatMap((id) => byCell.get(id) || []);
    let minDist = Infinity;
    for (const otro of vecinos) {
      if (otro === est) continue;
      const d = haversine(est.lat, est.lng, otro.lat, otro.lng);
      if (d > 0 && d < minDist) minDist = d;
    }
    est.distCompetidorM = Number.isFinite(minDist) ? minDist : 2000; // sin competidor cercano detectado
  }
}

// 5b. Concentración relativa de colonia (para todos los giros combinados)
const conteoColonia = new Map();
for (const est of todos) {
  conteoColonia.set(est.colonia, (conteoColonia.get(est.colonia) || 0) + 1);
}
const maxColonia = Math.max(...conteoColonia.values());

// 5c. Diversidad comercial por celda (cuántos de los 5 giros están presentes)
function diversidad(counts) {
  return GIROS.filter((g) => counts[g] > 0).length / GIROS.length;
}

// 5d. Normalización min-max por percentiles (evita outliers)
function normalizar(valor, min, max) {
  if (max === min) return 0.5;
  return Math.min(1, Math.max(0, (valor - min) / (max - min)));
}

const distanciasPorGiro = Object.fromEntries(
  GIROS.map((g) => [g, porGiro[g].map((e) => e.distCompetidorM)]),
);
const p95PorGiro = Object.fromEntries(
  GIROS.map((g) => [g, ss.quantile(distanciasPorGiro[g], 0.95) || 500]),
);

const densidadPorGiroPorCelda = Object.fromEntries(
  GIROS.map((g) => [g, cellIds.map((id) => cellMap.get(id).counts[g])]),
);
const maxDensidadPorGiro = Object.fromEntries(
  GIROS.map((g) => [g, Math.max(1, ...densidadPorGiroPorCelda[g])]),
);

const PESOS = { densidad: 0.3, distancia: 0.2, concentracion: 0.2, diversidad: 0.15, vial: 0.15 };

const h3Grid = cellIds.map((id, idx) => {
  const [lat, lng] = h3.cellToLatLng(id);
  const counts = cellMap.get(id).counts;
  const total = totalesPorCelda[idx];
  const isc = Number((total / AREA_KM2).toFixed(2));

  const establecimientosEnCelda = GIROS.flatMap((g) =>
    porGiro[g].filter((e) => e.h3 === id),
  );
  const coloniasEnCelda = [...new Set(establecimientosEnCelda.map((e) => e.colonia))];
  const concentracionColonia =
    coloniasEnCelda.reduce((acc, c) => acc + (conteoColonia.get(c) || 0), 0) /
    Math.max(1, coloniasEnCelda.length) /
    maxColonia;

  const iom = Object.fromEntries(
    GIROS.map((g) => {
      const densidadNorm = normalizar(counts[g], 0, maxDensidadPorGiro[g]);
      const establecimientosGiroEnCelda = porGiro[g].filter((e) => e.h3 === id);
      const distProm = establecimientosGiroEnCelda.length
        ? ss.mean(establecimientosGiroEnCelda.map((e) => e.distCompetidorM))
        : p95PorGiro[g]; // sin competidores en la celda -> distancia alta (favorable)
      const distanciaNorm = normalizar(distProm, 0, p95PorGiro[g]);
      const diversidadNorm = diversidad(counts);
      const vialNorm = normalizar(
        establecimientosEnCelda.length, // proxy simple de actividad económica/vial
        0,
        20,
      );

      const score =
        PESOS.densidad * (1 - densidadNorm) +
        PESOS.distancia * distanciaNorm +
        PESOS.concentracion * (1 - concentracionColonia) +
        PESOS.diversidad * diversidadNorm +
        PESOS.vial * vialNorm;

      return [g, Math.round(score * 100)];
    }),
  );

  return {
    h3: id,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    counts,
    total,
    areaKm2: Number(AREA_KM2.toFixed(4)),
    isc,
    iscClase: clasificarISC(isc),
    iom,
  };
});

fs.writeFileSync(path.join(DATA_DIR, 'h3-grid.json'), JSON.stringify(h3Grid));
console.log(`✔ Grid H3 escrita: ${h3Grid.length} celdas -> public/data/h3-grid.json`);

// ---------------------------------------------------------------------------
// 6. Agregados de ciudad para el dashboard
// ---------------------------------------------------------------------------
function topN(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

const conteoAlcaldia = new Map();
for (const est of todos) {
  conteoAlcaldia.set(est.alcaldia, (conteoAlcaldia.get(est.alcaldia) || 0) + 1);
}

const coloniaAlcaldia = new Map();
for (const est of todos) {
  if (!coloniaAlcaldia.has(est.colonia)) coloniaAlcaldia.set(est.colonia, est.alcaldia);
}

const altasPorAnio = new Map();
for (const est of todos) {
  const anio = (est.fechaAlta || '').slice(0, 4);
  if (!anio) continue;
  altasPorAnio.set(anio, (altasPorAnio.get(anio) || 0) + 1);
}

const iscPorAlcaldia = new Map();
const iomPorAlcaldia = new Map();
for (const cell of h3Grid) {
  const estsEnCelda = GIROS.flatMap((g) => porGiro[g].filter((e) => e.h3 === cell.h3));
  const alcaldiasEnCelda = [...new Set(estsEnCelda.map((e) => e.alcaldia))];
  for (const a of alcaldiasEnCelda) {
    if (!iscPorAlcaldia.has(a)) iscPorAlcaldia.set(a, []);
    iscPorAlcaldia.get(a).push(cell.isc);
    if (!iomPorAlcaldia.has(a)) iomPorAlcaldia.set(a, []);
    iomPorAlcaldia.get(a).push(ss.mean(GIROS.map((g) => cell.iom[g])));
  }
}

const stats = {
  totalPorGiro: Object.fromEntries(GIROS.map((g) => [g, porGiro[g].length])),
  totalGeneral: todos.length,
  topColonias: topN(conteoColonia, 20).map(([colonia, total]) => ({
    colonia,
    alcaldia: coloniaAlcaldia.get(colonia) || '',
    total,
  })),
  topAlcaldias: topN(conteoAlcaldia, 16).map(([alcaldia, total]) => ({ alcaldia, total })),
  altasPorAnio: [...altasPorAnio.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([anio, total]) => ({ anio, total })),
  alcaldiaMasSaturada: (() => {
    const [alcaldia, valores] = [...iscPorAlcaldia.entries()].sort(
      (a, b) => ss.mean(b[1]) - ss.mean(a[1]),
    )[0];
    return { alcaldia, isc: Number(ss.mean(valores).toFixed(1)) };
  })(),
  alcaldiaMayorOportunidad: (() => {
    const [alcaldia, valores] = [...iomPorAlcaldia.entries()].sort(
      (a, b) => ss.mean(b[1]) - ss.mean(a[1]),
    )[0];
    return { alcaldia, iom: Number(ss.mean(valores).toFixed(1)) };
  })(),
};

fs.writeFileSync(path.join(DATA_DIR, 'city-stats.json'), JSON.stringify(stats, null, 2));
console.log('✔ Agregados de ciudad escritos -> public/data/city-stats.json');
