'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Radar, MapPin, Hash, Users, Calendar } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { loadGiroLayer } from '@/lib/data/loadLayers';
import { competidoresEnRadio, distanciaCompetidorMasCercano } from '@/lib/geo/turf-analysis';
import { GIRO_CONFIG, type EstablecimientoFeature } from '@/types/denue';

export default function FeaturePopup() {
  const feature = useMapModeStore((s) => s.featureSeleccionado);
  const setFeature = useMapModeStore((s) => s.setFeatureSeleccionado);
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const setAnalisisActivo = useMapModeStore((s) => s.setAnalisisActivo);
  const radioMetros = useMapModeStore((s) => s.radioMetros);
  const setRadioMetros = useMapModeStore((s) => s.setRadioMetros);

  const [mismoGiro, setMismoGiro] = useState<EstablecimientoFeature[]>([]);
  const [giroCargado, setGiroCargado] = useState<string | null>(null);

  useEffect(() => {
    if (!feature) return;
    let cancelado = false;
    loadGiroLayer(feature.giro).then((data) => {
      if (cancelado) return;
      setMismoGiro(data.features);
      setGiroCargado(feature.giro);
    });
    return () => {
      cancelado = true;
    };
  }, [feature?.giro]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!feature) return null;

  const cargando = giroCargado !== feature.giro;

  const distCercano = mismoGiro.length ? distanciaCompetidorMasCercano(feature, mismoGiro) : null;
  const mostrandoRadio = analisisActivo === 'radio-competencia';
  const competidores = mostrandoRadio ? competidoresEnRadio(feature, mismoGiro, radioMetros) : [];

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${feature.lat},${feature.lng}`;

  return (
    <AnimatePresence>
      <motion.div
        key={feature.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.2 }}
        className="absolute top-4 right-4 bottom-4 w-80 max-w-[90vw] rounded-2xl bg-white shadow-2xl shadow-mm-carbon/20 border border-mm-taupe flex flex-col overflow-hidden z-20"
      >
        <div
          className="px-4 py-3 flex items-start justify-between shrink-0"
          style={{ backgroundColor: `${GIRO_CONFIG[feature.giro].color}18` }}
        >
          <div>
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1.5"
              style={{ backgroundColor: GIRO_CONFIG[feature.giro].color, color: '#FAFAF7' }}
            >
              {GIRO_CONFIG[feature.giro].label}
            </span>
            <h3 className="text-sm font-bold leading-snug pr-2">{feature.nombre}</h3>
          </div>
          <button onClick={() => setFeature(null)} className="p-1 rounded-full hover:bg-mm-carbon/10 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-mm-taupe-dark mt-0.5 shrink-0" />
            <div>
              <div>{feature.direccion}</div>
              <div className="text-mm-taupe-dark text-xs mt-0.5">
                {feature.colonia} · CP {feature.codigoPostal} · {feature.alcaldia}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Hash size={15} className="text-mm-taupe-dark shrink-0" />
            <span className="text-xs text-mm-taupe-dark">SCIAN {feature.scian}</span>
          </div>

          <div className="flex items-center gap-2">
            <Users size={15} className="text-mm-taupe-dark shrink-0" />
            <span className="text-xs text-mm-taupe-dark">{feature.personalOcupado}</span>
          </div>

          {feature.fechaAlta && (
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-mm-taupe-dark shrink-0" />
              <span className="text-xs text-mm-taupe-dark">Alta DENUE: {feature.fechaAlta}</span>
            </div>
          )}

          <div className="pt-1 text-xs text-mm-taupe-dark tabular-nums">
            {feature.lat.toFixed(5)}, {feature.lng.toFixed(5)}
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-mm-carbon text-mm-bone text-xs font-semibold py-2.5 hover:bg-mm-carbon-light transition-colors"
          >
            Abrir en Google Maps <ExternalLink size={13} />
          </a>

          <div className="pt-3 border-t border-mm-taupe">
            <button
              onClick={() => setAnalisisActivo(mostrandoRadio ? null : 'radio-competencia')}
              className={`w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold py-2.5 transition-colors ${
                mostrandoRadio ? 'bg-mm-mustard text-mm-carbon' : 'bg-mm-taupe/60 text-mm-carbon hover:bg-mm-taupe'
              }`}
            >
              <Radar size={14} /> {mostrandoRadio ? 'Ocultar radio de competencia' : 'Analizar este negocio'}
            </button>

            {!cargando && distCercano !== null && (
              <p className="text-xs text-mm-taupe-dark mt-2 text-center">
                Competidor del mismo giro más cercano: <b className="text-mm-carbon">{distCercano} m</b>
              </p>
            )}

            {mostrandoRadio && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1.5">
                  {([100, 250, 500] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRadioMetros(r)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        radioMetros === r ? 'bg-mm-carbon text-mm-bone' : 'bg-mm-taupe/60 hover:bg-mm-taupe'
                      }`}
                    >
                      {r} m
                    </button>
                  ))}
                </div>
                <div className="rounded-xl bg-mm-taupe/40 px-3 py-2.5 text-center">
                  <div className="text-2xl font-bold tabular-nums">{competidores.length}</div>
                  <div className="text-[11px] text-mm-taupe-dark">
                    competidores de {GIRO_CONFIG[feature.giro].label.toLowerCase()} en {radioMetros} m
                  </div>
                </div>
                {competidores.slice(0, 5).map((c) => (
                  <div key={c.establecimiento.id} className="flex justify-between text-xs px-1">
                    <span className="truncate pr-2">{c.establecimiento.nombre}</span>
                    <span className="text-mm-taupe-dark tabular-nums shrink-0">{c.distanciaM} m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
