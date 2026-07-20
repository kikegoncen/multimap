'use client';

import { Pill, Coffee, ShoppingCart, Glasses, Sparkles } from 'lucide-react';
import { GIRO_CONFIG, type Giro } from '@/types/denue';

const ICONS: Record<Giro, React.ComponentType<{ size?: number }>> = {
  farmacia: Pill,
  cafeteria: Coffee,
  minisuper: ShoppingCart,
  optica: Glasses,
  perfumeria: Sparkles,
};

const GIROS = Object.keys(GIRO_CONFIG) as Giro[];

interface GiroSelectorProps {
  seleccionados: Giro[];
  onChange: (giros: Giro[]) => void;
}

export default function GiroSelector({ seleccionados, onChange }: GiroSelectorProps) {
  function toggle(giro: Giro) {
    const yaEsta = seleccionados.includes(giro);
    if (yaEsta) {
      // Siempre debe quedar al menos un giro seleccionado.
      if (seleccionados.length === 1) return;
      onChange(seleccionados.filter((g) => g !== giro));
    } else {
      onChange([...seleccionados, giro]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {GIROS.map((giro) => {
        const Icon = ICONS[giro];
        const activo = seleccionados.includes(giro);
        return (
          <button
            key={giro}
            onClick={() => toggle(giro)}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold border transition-colors ${
              activo
                ? 'bg-mm-carbon text-mm-bone border-mm-carbon'
                : 'bg-white text-mm-carbon border-mm-taupe hover:bg-mm-taupe/40'
            }`}
          >
            <Icon size={14} />
            {GIRO_CONFIG[giro].label}
          </button>
        );
      })}
    </div>
  );
}
