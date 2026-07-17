'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { type Map as MLMap, type MapLayerMouseEvent } from 'maplibre-gl';
import * as h3 from 'h3-js';
import * as turf from '@turf/turf';
import { useLayerStore, type BaseMapStyle } from '@/stores/useLayerStore';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { loadGiroLayer, loadH3Grid } from '@/lib/data/loadLayers';
import { GIRO_CONFIG, type Establecimiento, type EstablecimientoFeature, type Giro, type H3Cell } from '@/types/denue';
import { competidoresEnRadio, dbscanClusters, featuresEnViewport } from '@/lib/geo/turf-analysis';

const BASEMAP_STYLES: Record<BaseMapStyle, string> = {
  claro: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  oscuro: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  satelite: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
};

const CDMX_CENTER: [number, number] = [-99.1332, 19.4326];
const GIROS: Giro[] = ['farmacia', 'cafeteria', 'minisuper', 'optica', 'perfumeria'];

interface MapCanvasProps {
  onFeatureCount?: (giro: Giro, count: number) => void;
}

export default function MapCanvas({ onFeatureCount }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const [ready, setReady] = useState(false);
  const [h3Grid, setH3Grid] = useState<H3Cell[]>([]);

  const capasActivas = useLayerStore((s) => s.capasActivas);
  const baseMap = useLayerStore((s) => s.baseMap);

  const modo = useMapModeStore((s) => s.modo);
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const giroSeleccionado = useMapModeStore((s) => s.giroSeleccionado);
  const featureSeleccionado = useMapModeStore((s) => s.featureSeleccionado);
  const radioMetros = useMapModeStore((s) => s.radioMetros);
  const dbscanEpsilonM = useMapModeStore((s) => s.dbscanEpsilonM);
  const dbscanMinPoints = useMapModeStore((s) => s.dbscanMinPoints);
  const setFeatureSeleccionado = useMapModeStore((s) => s.setFeatureSeleccionado);

  const establecimientosRef = useRef<Record<Giro, Establecimiento[]>>({
    farmacia: [], cafeteria: [], minisuper: [], optica: [], perfumeria: [],
  });
  const featuresRef = useRef<Record<Giro, EstablecimientoFeature[]>>({
    farmacia: [], cafeteria: [], minisuper: [], optica: [], perfumeria: [],
  });

  // ---------------------------------------------------------------------
  // Inicializar mapa
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLES.claro,
      center: CDMX_CENTER,
      zoom: 11,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      'bottom-right',
    );

    map.on('load', () => {
      mapRef.current = map;
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------
  // Cambiar mapa base (preserva capas al re-cargar el estilo)
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.setStyle(BASEMAP_STYLES[baseMap]);
    map.once('styledata', () => {
      setReady(false);
      setReady(true);
    });
  }, [baseMap]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------
  // Cargar los 5 GeoJSON de establecimientos como fuentes clusterizadas
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    let cancelado = false;

    (async () => {
      for (const giro of GIROS) {
        const data = await loadGiroLayer(giro);
        if (cancelado) return;
        establecimientosRef.current[giro] = data.features.map((f) => f.properties);
        featuresRef.current[giro] = data.features;
        onFeatureCount?.(giro, data.features.length);

        const sourceId = `src-${giro}`;
        const color = GIRO_CONFIG[giro].color;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: data as unknown as GeoJSON.FeatureCollection,
            cluster: true,
            clusterMaxZoom: 15,
            clusterRadius: 40,
          });

          map.addLayer({
            id: `${sourceId}-clusters`,
            type: 'circle',
            source: sourceId,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': color,
              'circle-opacity': 0.85,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FAFAF7',
              'circle-radius': ['step', ['get', 'point_count'], 16, 25, 22, 100, 28, 750, 34],
            },
          });

          map.addLayer({
            id: `${sourceId}-cluster-count`,
            type: 'symbol',
            source: sourceId,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Noto Sans Bold'],
              'text-size': 12,
            },
            paint: { 'text-color': '#FAFAF7' },
          });

          map.addLayer({
            id: `${sourceId}-points`,
            type: 'circle',
            source: sourceId,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': color,
              'circle-radius': 6,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#FAFAF7',
              'circle-opacity': 0.92,
            },
          });

          map.on('click', `${sourceId}-points`, (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            setFeatureSeleccionado(f.properties as unknown as Establecimiento);
          });
          map.on('click', `${sourceId}-clusters`, async (e: MapLayerMouseEvent) => {
            const f = e.features?.[0];
            if (!f) return;
            const clusterId = f.properties?.cluster_id;
            const src = map.getSource(sourceId) as maplibregl.GeoJSONSource;
            const zoom = await src.getClusterExpansionZoom(clusterId);
            map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
          });
          map.on('mouseenter', `${sourceId}-points`, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', `${sourceId}-points`, () => (map.getCanvas().style.cursor = ''));
          map.on('mouseenter', `${sourceId}-clusters`, () => (map.getCanvas().style.cursor = 'pointer'));
          map.on('mouseleave', `${sourceId}-clusters`, () => (map.getCanvas().style.cursor = ''));
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(
            data as unknown as GeoJSON.FeatureCollection,
          );
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------
  // Cargar grid H3 precomputada (ISC / IOM)
  // ---------------------------------------------------------------------
  useEffect(() => {
    loadH3Grid().then(setH3Grid);
  }, []);

  // ---------------------------------------------------------------------
  // Visibilidad de capas por giro
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const giro of GIROS) {
      const visibility = capasActivas[giro] ? 'visible' : 'none';
      for (const suffix of ['clusters', 'cluster-count', 'points']) {
        const id = `src-${giro}-${suffix}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility);
      }
    }
  }, [capasActivas, ready]);

  // ---------------------------------------------------------------------
  // Helper: (re)crear una fuente/capa genérica de "overlay" de análisis
  // ---------------------------------------------------------------------
  const upsertOverlay = useCallback(
    (id: string, data: GeoJSON.FeatureCollection, layerDef: Omit<maplibregl.LayerSpecification, 'id' | 'source'>) => {
      const map = mapRef.current;
      if (!map) return;
      if (map.getSource(id)) {
        (map.getSource(id) as maplibregl.GeoJSONSource).setData(data);
      } else {
        map.addSource(id, { type: 'geojson', data });
        map.addLayer({ id, source: id, ...layerDef } as maplibregl.LayerSpecification);
      }
    },
    [],
  );

  const removeOverlay = useCallback((id: string) => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getLayer(`${id}-line`)) map.removeLayer(`${id}-line`);
    if (map.getLayer(`${id}-label`)) map.removeLayer(`${id}-label`);
    if (map.getSource(id)) map.removeSource(id);
  }, []);

  // ---------------------------------------------------------------------
  // Análisis 1 — Heatmap nativo de MapLibre
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const id = 'overlay-heatmap';

    if (analisisActivo === 'heatmap') {
      loadGiroLayer(giroSeleccionado).then((data) => {
        upsertOverlay(id, data as unknown as GeoJSON.FeatureCollection, {
          type: 'heatmap',
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': 1.1,
            'heatmap-radius': 22,
            'heatmap-opacity': 0.75,
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(250,250,247,0)',
              0.2, '#E8E2D9',
              0.4, '#F0D264',
              0.6, '#E0A94C',
              0.8, '#C4634A',
              1, '#2E2A26',
            ],
          },
        });
      });
    } else {
      removeOverlay(id);
    }
  }, [analisisActivo, giroSeleccionado, ready, upsertOverlay, removeOverlay]);

  // ---------------------------------------------------------------------
  // Análisis 5 — Clustering DBSCAN sobre el viewport actual
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const id = 'overlay-dbscan';
    const activo = analisisActivo === 'dbscan';

    if (!activo) {
      removeOverlay(id);
      return;
    }

    const PALETTE = [
      '#5FA878', '#4C8CA8', '#8C6FB0', '#C4634A', '#D9B84A',
      '#7C9A6B', '#B0724C', '#6F8CB0', '#A85F8C', '#2E2A26',
    ];

    function recalcular() {
      if (!map) return;
      const bounds = map.getBounds();
      const bbox: [number, number, number, number] = [
        bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth(),
      ];
      const enViewport = featuresEnViewport(featuresRef.current[giroSeleccionado], bbox);

      if (enViewport.length < dbscanMinPoints) {
        upsertOverlay(id, turf.featureCollection([]), {
          type: 'circle',
          paint: { 'circle-color': '#A8998A', 'circle-radius': 6 },
        });
        return;
      }

      const clustered = dbscanClusters(enViewport, dbscanEpsilonM, dbscanMinPoints);
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: clustered.features.map((f) => {
          const clusterId = f.properties?.cluster as number | undefined;
          const esRuido = f.properties?.dbscan === 'noise' || clusterId === undefined;
          const color = esRuido ? '#A8998A' : PALETTE[clusterId % PALETTE.length];
          return { ...f, properties: { ...f.properties, color, esRuido } };
        }),
      };

      upsertOverlay(id, fc, {
        type: 'circle',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['case', ['get', 'esRuido'], 4, 7],
          'circle-opacity': ['case', ['get', 'esRuido'], 0.35, 0.9],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#FAFAF7',
        },
      });
    }

    recalcular();
    map.on('moveend', recalcular);
    return () => {
      map.off('moveend', recalcular);
    };
  }, [analisisActivo, giroSeleccionado, dbscanEpsilonM, dbscanMinPoints, ready, upsertOverlay, removeOverlay]);

  // ---------------------------------------------------------------------
  // Análisis 4/10 — Grid H3 (ISC) y Análisis 11 / Modo "¿Dónde abrir?" (IOM)
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || h3Grid.length === 0) return;
    const id = 'overlay-h3';

    const mostrarH3 = analisisActivo === 'h3' || modo === 'donde-abrir';

    if (mostrarH3) {
      const usarIOM = modo === 'donde-abrir';
      const fc: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: h3Grid.map((cell) => ({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [h3.cellToBoundary(cell.h3, true)] },
          properties: {
            h3: cell.h3,
            total: cell.total,
            isc: cell.isc,
            iscClase: cell.iscClase,
            iomGiro: cell.iom[giroSeleccionado],
            valor: usarIOM ? cell.iom[giroSeleccionado] : cell.isc,
          },
        })),
      };

      const fillColor: maplibregl.DataDrivenPropertyValueSpecification<string> = usarIOM
        ? [
            'interpolate', ['linear'], ['get', 'iomGiro'],
            0, '#C4634A',
            40, '#C4634A',
            55, '#E0A94C',
            70, '#9BC17C',
            100, '#5FA878',
          ]
        : [
            'interpolate', ['linear'], ['get', 'isc'],
            0, '#E8E2D9',
            5, '#F0D264',
            15, '#E0A94C',
            30, '#C4634A',
            60, '#2E2A26',
          ];

      upsertOverlay(id, fc, {
        type: 'fill',
        paint: { 'fill-color': fillColor, 'fill-opacity': 0.55 },
      });

      if (!map.getLayer(`${id}-line`)) {
        map.addLayer({
          id: `${id}-line`,
          type: 'line',
          source: id,
          paint: { 'line-color': '#2E2A26', 'line-width': 0.5, 'line-opacity': 0.25 },
        });
      }
    } else {
      removeOverlay(id);
    }
  }, [analisisActivo, modo, giroSeleccionado, h3Grid, ready, upsertOverlay, removeOverlay]);

  // ---------------------------------------------------------------------
  // Análisis 6/12 — Buffer / radio de competencia alrededor del feature seleccionado
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const id = 'overlay-buffer';

    const mostrarBuffer =
      featureSeleccionado && (analisisActivo === 'buffer' || analisisActivo === 'radio-competencia');

    if (mostrarBuffer && featureSeleccionado) {
      const buffer = turf.buffer(
        turf.point([featureSeleccionado.lng, featureSeleccionado.lat]),
        radioMetros,
        { units: 'meters' },
      );
      upsertOverlay(id, turf.featureCollection([buffer!]) as GeoJSON.FeatureCollection, {
        type: 'fill',
        paint: { 'fill-color': '#F0D264', 'fill-opacity': 0.18 },
      });
      if (!map.getLayer(`${id}-line`)) {
        map.addLayer({
          id: `${id}-line`,
          type: 'line',
          source: id,
          paint: { 'line-color': '#D9B84A', 'line-width': 2, 'line-dasharray': [2, 1] },
        });
      }
    } else {
      removeOverlay(id);
    }
  }, [analisisActivo, featureSeleccionado, radioMetros, ready, upsertOverlay, removeOverlay]);

  // ---------------------------------------------------------------------
  // Volar hacia el feature seleccionado
  // ---------------------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !featureSeleccionado) return;
    map.flyTo({ center: [featureSeleccionado.lng, featureSeleccionado.lat], zoom: Math.max(map.getZoom(), 15), speed: 1.2 });
  }, [featureSeleccionado]);

  return <div ref={containerRef} className="absolute inset-0" />;
}

/** Utilidad exportada: competidores de un establecimiento en un radio dado (usada por el panel de detalle). */
export function useCompetidoresDelSeleccionado() {
  // Se mantiene aquí como referencia de API; el cálculo real se hace en el
  // panel de detalle con los datos ya cargados en loadGiroLayer.
  return competidoresEnRadio;
}
