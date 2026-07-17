'use client';

import { useState } from 'react';
import MapCanvas from '@/components/map/MapCanvas';
import Header from '@/components/map/Header';
import LayerControl from '@/components/map/LayerControl';
import AnalysisDrawer from '@/components/analysis/AnalysisDrawer';
import FeaturePopup from '@/components/map/FeaturePopup';
import type { Giro } from '@/types/denue';

export default function MapaPage() {
  const [counts, setCounts] = useState<Record<Giro, number>>({
    farmacia: 0, cafeteria: 0, minisuper: 0, optica: 0, perfumeria: 0,
  });

  return (
    <main className="relative flex-1 w-full h-screen overflow-hidden">
      <MapCanvas onFeatureCount={(giro, count) => setCounts((c) => ({ ...c, [giro]: count }))} />
      <Header />

      <div className="absolute top-20 left-4 z-10 flex flex-col gap-3 max-h-[calc(100vh-6rem)]">
        <LayerControl counts={counts} />
        <AnalysisDrawer />
      </div>

      <FeaturePopup />
    </main>
  );
}
