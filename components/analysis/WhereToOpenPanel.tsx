'use client';

import { useEffect, useState } from 'react';
import { Sparkle, X } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { loadH3Grid } from '@/lib/data/loadLayers';
import { iomPromedioCiudad, mejoresCeldas } from '@/lib/geo/iom';
import { GIRO_CONFIG, type Giro, type H3Cell } from '@/types/denue';

const GIROS = Object.keys(GIRO_CONFIG) as Giro[];

export default function WhereToOpenPanel() {
  const modo = useMapModeStore((s) => s.modo);
  const setModo = useMapModeStore((s) => s.setModo);
  const giroSeleccionado = useMapModeStore((s) => s.giroSeleccionado);
  const setGiroSeleccionado = useMapModeStore((s) => s.setGiroSeleccionado);

  const [grid, setGrid] = useState<H3Cell[]>([]);

  useEffect(() => {
    if (modo === 'donde-abrir' && grid.length === 0) {
      loadH3Grid().then(setGrid);
    }
  }, [modo, grid.length]);

  if (modo !== 'donde-abrir') {
    return (
      <button
        onClick={() => setModo('donde-abrir')}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-mm-mustard text-mm-carbon font-bold py-3 text-sm shadow-md shadow-mm-mustard/40 hover:brightness-95 transition-all"
      >
        <Sparkle size={16} /> Modo &ldquo;¿Dónde abrir?&rdquo;
      </button>
    );
  }

  const promedio = grid.length ? iomPromedioCiudad(grid, giroSeleccionado) : null;
  const mejores = grid.length ? mejoresCeldas(grid, giroSeleccionado, 5) : [];

  return (
    <div className="rounded-2xl bg-mm-carbon text-mm-bone p-4 shadow-xl">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <Sparkle size={15} className="text-mm-mustard" /> ¿Dónde abrir?
        </h3>
        <button onClick={() => setModo('exploracion')} className="p-1 rounded-full hover:bg-white/10">
          <X size={15} />
        </button>
      </div>
      <p className="text-xs text-mm-taupe-dark mb-3">Elige un giro y descubre las zonas con mejor oportunidad.</p>

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {GIROS.map((g) => (
          <button
            key={g}
            onClick={() => setGiroSeleccionado(g)}
            className={`rounded-lg py-1.5 text-[11px] font-medium transition-colors ${
              giroSeleccionado === g ? 'bg-mm-mustard text-mm-carbon' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {GIRO_CONFIG[g].label}
          </button>
        ))}
      </div>

      {promedio !== null && (
        <div className="rounded-xl bg-white/10 px-3 py-2 mb-3 text-center">
          <div className="text-2xl font-bold tabular-nums text-mm-mustard">{promedio}</div>
          <div className="text-[11px] text-mm-taupe-dark">IOM promedio en CDMX para {GIRO_CONFIG[giroSeleccionado].label.toLowerCase()}</div>
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] mb-3">
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#5FA878] inline-block" /> Oportunidad</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#E0A94C] inline-block" /> Media</span>
        <span className="flex items-center gap-1"><i className="w-2.5 h-2.5 rounded-full bg-[#C4634A] inline-block" /> Saturada</span>
      </div>

      {mejores.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-mm-taupe-dark mb-1.5">Top 5 zonas hoy</h4>
          <div className="space-y-1">
            {mejores.map((cell, i) => (
              <div key={cell.h3} className="flex items-center justify-between text-xs">
                <span className="text-mm-taupe-dark">#{i + 1} · celda {cell.h3.slice(-4)}</span>
                <span className="font-semibold text-mm-mustard tabular-nums">{cell.iom[giroSeleccionado]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-mm-taupe-dark mt-3 italic">&ldquo;¿Abrirías aquí?&rdquo; — comparte esta vista en redes.</p>
    </div>
  );
}
