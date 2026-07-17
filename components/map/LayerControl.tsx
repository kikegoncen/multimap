'use client';

import { motion } from 'framer-motion';
import { Pill, Coffee, ShoppingCart, Glasses, Sparkles } from 'lucide-react';
import { useLayerStore } from '@/stores/useLayerStore';
import { GIRO_CONFIG, type Giro } from '@/types/denue';

const ICONS: Record<Giro, React.ComponentType<{ size?: number; className?: string }>> = {
  farmacia: Pill,
  cafeteria: Coffee,
  minisuper: ShoppingCart,
  optica: Glasses,
  perfumeria: Sparkles,
};

interface LayerControlProps {
  counts: Record<Giro, number>;
}

export default function LayerControl({ counts }: LayerControlProps) {
  const capasActivas = useLayerStore((s) => s.capasActivas);
  const toggleCapa = useLayerStore((s) => s.toggleCapa);
  const setTodasLasCapas = useLayerStore((s) => s.setTodasLasCapas);

  const giros = Object.keys(GIRO_CONFIG) as Giro[];
  const todasActivas = giros.every((g) => capasActivas[g]);

  return (
    <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-mm-carbon/10 border border-mm-taupe p-4 w-72">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-mm-carbon">Capas</h2>
        <button
          onClick={() => setTodasLasCapas(!todasActivas)}
          className="text-xs font-medium text-mm-taupe-dark hover:text-mm-carbon transition-colors"
        >
          {todasActivas ? 'Ocultar todas' : 'Mostrar todas'}
        </button>
      </div>

      <div className="space-y-1.5">
        {giros.map((giro) => {
          const Icon = ICONS[giro];
          const activa = capasActivas[giro];
          return (
            <button
              key={giro}
              onClick={() => toggleCapa(giro)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                activa ? 'bg-mm-taupe/60' : 'bg-transparent opacity-50'
              } hover:bg-mm-taupe/60`}
            >
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                style={{ backgroundColor: `${GIRO_CONFIG[giro].color}22` }}
              >
                <Icon size={16} className="shrink-0" />
              </span>
              <span className="flex-1 text-left text-sm font-medium">{GIRO_CONFIG[giro].label}</span>
              <span className="text-xs tabular-nums text-mm-taupe-dark">
                {counts[giro]?.toLocaleString('es-MX') ?? '…'}
              </span>
              <motion.span
                className="w-4 h-4 rounded-full border-2"
                style={{ borderColor: GIRO_CONFIG[giro].color, backgroundColor: activa ? GIRO_CONFIG[giro].color : 'transparent' }}
                animate={{ scale: activa ? 1 : 0.85 }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
