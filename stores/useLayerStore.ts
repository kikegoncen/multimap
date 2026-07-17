import { create } from 'zustand';
import type { Giro } from '@/types/denue';

export type BaseMapStyle = 'claro' | 'oscuro' | 'satelite';

interface LayerState {
  capasActivas: Record<Giro, boolean>;
  baseMap: BaseMapStyle;
  toggleCapa: (giro: Giro) => void;
  setTodasLasCapas: (activo: boolean) => void;
  setBaseMap: (style: BaseMapStyle) => void;
}

export const useLayerStore = create<LayerState>((set) => ({
  capasActivas: {
    farmacia: true,
    cafeteria: true,
    minisuper: true,
    optica: true,
    perfumeria: true,
  },
  baseMap: 'claro',
  toggleCapa: (giro) =>
    set((s) => ({ capasActivas: { ...s.capasActivas, [giro]: !s.capasActivas[giro] } })),
  setTodasLasCapas: (activo) =>
    set((s) => ({
      capasActivas: Object.fromEntries(
        Object.keys(s.capasActivas).map((g) => [g, activo]),
      ) as Record<Giro, boolean>,
    })),
  setBaseMap: (style) => set({ baseMap: style }),
}));
