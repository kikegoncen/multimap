# Multimap — Mapa de los Negocios Más Rentables de la CDMX

Geovisor de geomarketing construido con **Next.js 16 + TypeScript + MapLibre GL JS + TurfJS + H3 + Chart.js**, sobre datos reales del DENUE (INEGI): 29,325 establecimientos (farmacias, cafeterías, tiendas de conveniencia, ópticas y perfumerías) en las 16 alcaldías de la CDMX.

Incluye el **Índice de Oportunidad Multimap (IOM)** y el modo **"¿Dónde abrir?"**, además de heatmaps, hexágonos H3 con el Índice de Saturación Comercial (ISC), radio de competencia, buscador y un dashboard con KPIs y gráficas.

## Correr el proyecto

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`. Requiere conexión a internet en el navegador (no en build) para cargar los mapas base de CARTO (`basemaps.cartocdn.com`, gratuitos y sin API key).

## Pipeline de datos

Los GeoJSON ya vienen limpios y precomputados en `public/data/`. Si quieres regenerarlos a partir de los archivos originales del DENUE:

```bash
# 1. Coloca los 5 GeoJSON originales en raw-data/
#    (farmacias.geojson, cafeterias.geojson, minisupers.geojson,
#     opticas.geojson, perfumerias.geojson)

npm run data:clean   # limpia encoding y normaliza campos -> public/data/*.geojson
npm run data:h3      # precalcula grid H3 con ISC + IOM -> public/data/h3-grid.json
                      # y agregados de ciudad -> public/data/city-stats.json

# o ambos en un solo paso:
npm run data:build
```

**Nota sobre el encoding:** los archivos fuente del DENUE traen los acentos ya perdidos (sustituidos por el carácter de reemplazo Unicode desde su origen, no por un problema de este pipeline). `scripts/clean-denue.mjs` reconstruye correctamente alcaldías vía `cve_mun` (catálogo oficial INEGI); para colonias y nombres de establecimiento (texto libre) solo puede limpiar el glifo roto, no adivinar la letra exacta.

## Estructura

```
app/            rutas (landing, /mapa, /dashboard)
components/     map/, analysis/, dashboard/, search/
lib/geo/        funciones puras de TurfJS, IOM, ISC
lib/data/       carga de GeoJSON/JSON precomputados
stores/         estado global (Zustand)
scripts/        pipeline de datos (limpieza + precómputo H3)
types/          tipos de dominio compartidos
public/data/    GeoJSON limpios + grid H3 + agregados de ciudad
raw-data/       GeoJSON originales del DENUE (input del pipeline)
```

## Qué está implementado

- Landing con identidad de marca (paleta extraída del logo real: carbón + mostaza + taupe), SEO/OpenGraph.
- Geovisor: 5 capas con clustering nativo de MapLibre, buscador de colonia/alcaldía/establecimiento, popup profesional, mapa base intercambiable.
- Heatmap (Análisis 1), grid H3 con ISC (Análisis 4 y 10), buffers de influencia (Análisis 6), radio de competencia con conteo real (Análisis 7 y 12), rankings de colonias y alcaldías (Análisis 8 y 9).
- **IOM** precalculado por celda H3 y por giro (Análisis 11 + la métrica propietaria propuesta).
- **Modo "¿Dónde abrir?"**: coropleta verde/amarillo/rojo por giro, top 5 zonas del día.
- Dashboard con KPIs, dona de mix de giros, ranking de alcaldías, evolución de altas por año.

## Roadmap / gaps de datos conocidos (ver documento de arquitectura)

- **Clustering DBSCAN (Análisis 5):** la función `dbscanClusters` ya está lista en `lib/geo/turf-analysis.ts`; falta exponerla en un control de UI (pensada para ejecutarse sobre el viewport actual, no la ciudad completa, por performance).
- **Vector tiles (PMTiles/tippecanoe):** para escalar más allá de 29k puntos sin degradar el rendimiento en gama baja, la arquitectura recomienda tiling con `tippecanoe` en vez de servir los GeoJSON completos. No incluido en este build por la dependencia de un binario externo; los GeoJSON actuales funcionan bien con el clustering nativo de MapLibre a esta escala.
- **Polígonos de colonia:** los análisis por colonia usan agregación por nombre (`nomb_asent`), no polígonos reales (no vienen en los GeoJSON fuente, que son solo puntos). Si se consigue la capa del Marco Geoestadístico INEGI, se puede sustituir fácilmente.
- **IOM v2:** incorporar población/NSE por AGEB (el campo `ageb` ya está disponible en los datos originales) y flujo peatonal si se contrata un proveedor de movilidad.
- Modo embed, comparador de alcaldías, reporte PDF descargable y alertas de nuevas aperturas — mejoras propuestas, no implementadas aún.
