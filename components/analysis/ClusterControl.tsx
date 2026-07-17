'use client';

import { Waypoints } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { GIRO_CONFIG, type Giro } from '@/types/denue';

const GIROS = Object.keys(GIRO_CONFIG) as Giro[];

export default function ClusterControl() {
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const setAnalisisActivo = useMapModeStore((s) => s.setAnalisisActivo);
  const giroSeleccionado = useMapModeStore((s) => s.giroSeleccionado);
  const setGiroSeleccionado = useMapModeStore((s) => s.setGiroSeleccionado);
  const dbscanEpsilonM = useMapModeStore((s) => s.dbscanEpsilonM);
  const setDbscanEpsilonM = useMapModeStore((s) => s.setDbscanEpsilonM);
  const dbscanMinPoints = useMapModeStore((s) => s.dbscanMinPoints);
  const setDbscanMinPoints = useMapModeStore((s) => s.setDbscanMinPoints);

  const activo = analisisActivo === 'dbscan';

  return (
    <div className="rounded-xl bg-mm-taupe/30 p-3">
      <button
        onClick={() => setAnalisisActivo(activo ? null : 'dbscan')}
        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          activo ? 'bg-mm-carbon text-mm-bone' : 'bg-white hover:bg-mm-taupe/60'
        }`}
      >
        <Waypoints size={15} /> Clustering (DBSCAN)
      </button>
      <p className="text-xs text-mm-taupe-dark mt-2">
        Agrupa negocios cercanos entre sí dentro del área visible del mapa. Cada color es un clúster distinto; los puntos grises son ruido (sin vecinos suficientes).
      </p>

      {activo && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
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

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-mm-taupe-dark">Distancia máxima (ε)</span>
              <span className="font-semibold tabular-nums">{dbscanEpsilonM} m</span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              step={25}
              value={dbscanEpsilonM}
              onChange={(e) => setDbscanEpsilonM(Number(e.target.value))}
              className="w-full accent-[#2E2A26]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-mm-taupe-dark">Mínimo de puntos</span>
              <span className="font-semibold tabular-nums">{dbscanMinPoints}</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              step={1}
              value={dbscanMinPoints}
              onChange={(e) => setDbscanMinPoints(Number(e.target.value))}
              className="w-full accent-[#2E2A26]"
            />
          </div>

          <p className="text-[10px] text-mm-taupe-dark italic">
            Se recalcula automáticamente al mover o hacer zoom en el mapa.
          </p>
        </div>
      )}
    </div>
  );
}
