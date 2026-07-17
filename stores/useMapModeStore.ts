import { create } from 'zustand';
import type { Establecimiento, Giro } from '@/types/denue';

export type ModoMapa = 'exploracion' | 'donde-abrir';
export type AnalisisActivo =
  | null
  | 'heatmap'
  | 'h3'
  | 'dbscan'
  | 'buffer'
  | 'radio-competencia';

interface MapModeState {
  modo: ModoMapa;
  analisisActivo: AnalisisActivo;
  giroSeleccionado: Giro;
  featureSeleccionado: Establecimiento | null;
  radioMetros: 100 | 250 | 500;
  dbscanEpsilonM: number;
  dbscanMinPoints: number;
  setModo: (m: ModoMapa) => void;
  setAnalisisActivo: (a: AnalisisActivo) => void;
  setGiroSeleccionado: (g: Giro) => void;
  setFeatureSeleccionado: (f: Establecimiento | null) => void;
  setRadioMetros: (r: 100 | 250 | 500) => void;
  setDbscanEpsilonM: (m: number) => void;
  setDbscanMinPoints: (n: number) => void;
}

export const useMapModeStore = create<MapModeState>((set) => ({
  modo: 'exploracion',
  analisisActivo: null,
  giroSeleccionado: 'farmacia',
  featureSeleccionado: null,
  radioMetros: 250,
  dbscanEpsilonM: 150,
  dbscanMinPoints: 3,
  setModo: (m) => set({ modo: m, analisisActivo: null }),
  setAnalisisActivo: (a) => set({ analisisActivo: a }),
  setGiroSeleccionado: (g) => set({ giroSeleccionado: g }),
  setFeatureSeleccionado: (f) => set({ featureSeleccionado: f }),
  setRadioMetros: (r) => set({ radioMetros: r }),
  setDbscanEpsilonM: (m) => set({ dbscanEpsilonM: m }),
  setDbscanMinPoints: (n) => set({ dbscanMinPoints: n }),
}));
