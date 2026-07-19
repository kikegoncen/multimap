/**
 * scripts/clean-denue.mjs
 *
 * Fase 1 del pipeline de datos (ver §10 del documento de arquitectura).
 * - Corrige el encoding roto de los GeoJSON fuente del DENUE (Latin-1 mal
 *   decodificado como UTF-8, ej. "M�XICO" -> "México").
 * - Normaliza cada feature al tipo `Establecimiento`.
 * - Descarta registros sin coordenadas válidas.
 * - Escribe un GeoJSON limpio por giro en /public/data, listo para el mapa.
 *
 * Uso: node scripts/clean-denue.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, '..', 'raw-data');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');

const GIROS = {
  farmacias: 'farmacia',
  cafeterias: 'cafeteria',
  minisupers: 'minisuper',
  opticas: 'optica',
  perfumerias: 'perfumeria',
};

fs.mkdirSync(OUT_DIR, { recursive: true });

/**
 * IMPORTANTE — hallazgo durante el pipeline:
 * Los bytes originales con acentos ya vienen sustituidos por el carácter de
 * reemplazo U+FFFD *dentro del propio archivo fuente* (se verificó a nivel de
 * bytes crudos: "SAN JOS\xEF\xBF\xBD" = "SAN JOS" + U+FFFD ya en UTF-8).
 * Es decir, la pérdida ocurrió aguas arriba y el carácter original ya no es
 * recuperable por transcodificación.
 *
 * Estrategia pragmática:
 *  - Campos de vocabulario controlado (alcaldía) se reconstruyen 100%
 *    correctos usando el catálogo oficial INEGI + cve_mun, que sí viene intacta.
 *  - Campos de texto libre (nombre de establecimiento, colonia) sólo pueden
 *    limpiarse quitando el glifo roto, ya que no hay forma de adivinar con
 *    certeza la letra acentuada perdida sin una fuente de datos alterna.
 */
function fixEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\uFFFD/g, '').replace(/\s{2,}/g, ' ').trim();
}

const ALCALDIAS_POR_CVE_MUN = {
  '002': 'Azcapotzalco',
  '003': 'Coyoacán',
  '004': 'Cuajimalpa de Morelos',
  '005': 'Gustavo A. Madero',
  '006': 'Iztacalco',
  '007': 'Iztapalapa',
  '008': 'La Magdalena Contreras',
  '009': 'Milpa Alta',
  '010': 'Álvaro Obregón',
  '011': 'Tláhuac',
  '012': 'Tlalpan',
  '013': 'Xochimilco',
  '014': 'Benito Juárez',
  '015': 'Cuauhtémoc',
  '016': 'Miguel Hidalgo',
  '017': 'Venustiano Carranza',
};

function resolveAlcaldia(p) {
  const cve = String(p.cve_mun ?? '').padStart(3, '0');
  return ALCALDIAS_POR_CVE_MUN[cve] || fixEncoding(p.municipio) || 'Sin alcaldía';
}

function buildDireccion(p) {
  const partes = [p.tipo_vial, p.nom_vial, p.numero_ext || p.letra_ext].filter(Boolean);
  return fixEncoding(partes.join(' ')) || 'Sin dirección registrada';
}

function normalizarTexto(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos para comparar
}

/**
 * Algunos archivos fuente mezclan, bajo el mismo giro, actividades SCIAN
 * adyacentes que NO son el giro real (se confirmó con los datos: farmacias
 * traía 2,302 registros de "productos naturistas/homeopáticos"). Por
 * instrucción explícita, para farmacias el filtro se hace sobre el NOMBRE
 * del establecimiento (nom_estab), exigiendo que contenga la palabra
 * "farmacia"/"farmacias".
 */
const PALABRA_CLAVE_POR_GIRO = {
  farmacia: 'farmacia', // coincide con "farmacia" y "farmacias" (substring)
};
const CAMPO_FILTRO_POR_GIRO = {
  farmacia: 'nom_estab',
};

function actividadCoincideConGiro(p, giro) {
  const palabraClave = PALABRA_CLAVE_POR_GIRO[giro];
  if (!palabraClave) return true; // giros sin ambigüedad conocida: no se filtra
  const campo = CAMPO_FILTRO_POR_GIRO[giro] || 'nombre_act';
  return normalizarTexto(p[campo]).includes(palabraClave);
}

function normalizeFeature(feature, giro) {
  const p = feature.properties || {};
  const lat = Number(p.latitud);
  const lng = Number(p.longitud);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
    return null;
  }
  if (!actividadCoincideConGiro(p, giro)) {
    return null;
  }

  const establecimiento = {
    id: String(p.id ?? p.clee ?? `${giro}-${lat}-${lng}`),
    nombre: fixEncoding(p.nom_estab) || 'Establecimiento sin nombre',
    giro,
    scian: String(p.codigo_act ?? ''),
    personalOcupado: fixEncoding(p.per_ocu) || 'No especificado',
    direccion: buildDireccion(p),
    colonia: fixEncoding(p.nomb_asent) || 'Sin colonia',
    codigoPostal: String(p.cod_postal ?? '').padStart(5, '0'),
    alcaldia: resolveAlcaldia(p),
    lat,
    lng,
    fechaAlta: p.fecha_alta || '',
  };

  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: establecimiento,
  };
}

const summary = [];

for (const [fileBase, giro] of Object.entries(GIROS)) {
  const rawPath = path.join(RAW_DIR, `${fileBase}.geojson`);
  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  const features = raw.features
    .map((f) => normalizeFeature(f, giro))
    .filter(Boolean);

  const collection = { type: 'FeatureCollection', features };

  fs.writeFileSync(
    path.join(OUT_DIR, `${giro}.geojson`),
    JSON.stringify(collection),
  );

  summary.push({ giro, total: features.length, descartados: raw.features.length - features.length });
  console.log(`✔ ${giro}: ${features.length} establecimientos limpios (${raw.features.length - features.length} descartados)`);
}

fs.writeFileSync(path.join(OUT_DIR, 'clean-summary.json'), JSON.stringify(summary, null, 2));
console.log('\nListo. GeoJSON limpios escritos en public/data/');
