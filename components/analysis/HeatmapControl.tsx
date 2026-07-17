'use client';

import { Flame } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { GIRO_CONFIG, type Giro } from '@/types/denue';

const GIROS = Object.keys(GIRO_CONFIG) as Giro[];

export default function HeatmapControl() {
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const setAnalisisActivo = useMapModeStore((s) => s.setAnalisisActivo);
  const giroSeleccionado = useMapModeStore((s) => s.giroSeleccionado);
  const setGiroSeleccionado = useMapModeStore((s) => s.setGiroSeleccionado);

  const activo = analisisActivo === 'heatmap';

  return (
    <div className="rounded-xl bg-mm-taupe/30 p-3">
      <button
        onClick={() => setAnalisisActivo(activo ? null : 'heatmap')}
        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          activo ? 'bg-mm-carbon text-mm-bone' : 'bg-white hover:bg-mm-taupe/60'
        }`}
      >
        <Flame size={15} /> Mapa de densidad (heatmap)
      </button>
      <p className="text-xs text-mm-taupe-dark mt-2">
        Concentración visual de establecimientos. Actívalo y elige un giro.
      </p>
      {activo && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {GIROS.map((g) => (
            <button
              key={g}
              onClick={() => setGiroSeleccionado(g)}
              className={`rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
                giroSeleccionado === g ? 'bg-mm-mustard text-mm-carbon' : 'bg-white hover:bg-mm-taupe/60'
              }`}
            >
              {GIRO_CONFIG[g].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
