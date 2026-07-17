'use client';

import { Hexagon } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';

const LEYENDA_ISC: { clase: string; color: string }[] = [
  { clase: 'Muy Baja', color: '#E8E2D9' },
  { clase: 'Baja', color: '#F0D264' },
  { clase: 'Media', color: '#E0A94C' },
  { clase: 'Alta', color: '#C4634A' },
  { clase: 'Muy Alta', color: '#2E2A26' },
];

export default function H3HexControl() {
  const analisisActivo = useMapModeStore((s) => s.analisisActivo);
  const setAnalisisActivo = useMapModeStore((s) => s.setAnalisisActivo);

  const activo = analisisActivo === 'h3';

  return (
    <div className="rounded-xl bg-mm-taupe/30 p-3">
      <button
        onClick={() => setAnalisisActivo(activo ? null : 'h3')}
        className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
          activo ? 'bg-mm-carbon text-mm-bone' : 'bg-white hover:bg-mm-taupe/60'
        }`}
      >
        <Hexagon size={15} /> Saturación comercial (ISC · H3)
      </button>
      <p className="text-xs text-mm-taupe-dark mt-2">
        Índice propio: establecimientos entre área de cada hexágono (~0.7 km²), clasificado por quintiles.
      </p>
      {activo && (
        <div className="mt-2 space-y-1">
          {LEYENDA_ISC.map((l) => (
            <div key={l.clase} className="flex items-center gap-2 text-xs">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
              {l.clase}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
