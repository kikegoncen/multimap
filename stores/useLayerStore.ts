import { create } from 'zustand';
import type { Giro } from '@/types/denue';

interface LayerState {
  capasActivas: Record<Giro, boolean>;
  toggleCapa: (giro: Giro) => void;
  setTodasLasCapas: (activo: boolean) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  capasActivas: {
    farmacia: true,
    cafeteria: false,
    minisuper: false,
    optica: false,
    perfumeria: false,
  },
  toggleCapa: (giro) =>
    set((s) => ({ capasActivas: { ...s.capasActivas, [giro]: !s.capasActivas[giro] } })),
  setTodasLasCapas: (activo) =>
    set((s) => ({
      capasActivas: Object.fromEntries(
        Object.keys(s.capasActivas).map((g) => [g, activo]),
      ) as Record<Giro, boolean>,
    })),
}));
