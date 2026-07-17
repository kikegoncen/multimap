'use client';

import { Circle } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';

export default function BufferControl() {
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const setAnalisisActivo = useMapModeStore((s) => s.setAnalisisActivo);
  const featureSeleccionado = useMapModeStore((s) => s.featureSeleccionado);
  const radioMetros = useMapModeStore((s) => s.radioMetros);
  const setRadioMetros = useMapModeStore((s) => s.setRadioMetros);

  const activo = analisisActivo === 'buffer';

  return (
    <div className="rounded-xl bg-mm-taupe/30 p-3">
      <button
        onClick={() => setAnalisisActivo(activo ? null : 'buffer')}
        disabled={!featureSeleccionado}
        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
          activo ? 'bg-mm-carbon text-mm-bone' : 'bg-white hover:bg-mm-taupe/60'
        }`}
      >
        <Circle size={15} /> Área de influencia
      </button>
      <p className="text-xs text-mm-taupe-dark mt-2">
        {featureSeleccionado
          ? 'Dibuja un radio alrededor del negocio seleccionado.'
          : 'Selecciona un negocio en el mapa para activar este análisis.'}
      </p>
      {activo && (
        <div className="flex gap-1.5 mt-2">
          {([100, 250, 500] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRadioMetros(r)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                radioMetros === r ? 'bg-mm-mustard text-mm-carbon' : 'bg-white hover:bg-mm-taupe/60'
              }`}
            >
              {r} m
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
