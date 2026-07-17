'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BarChart3, Layers, Trophy, Sparkle } from 'lucide-react';
import HeatmapControl from './HeatmapControl';
import H3HexControl from './H3HexControl';
import ClusterControl from './ClusterControl';
import BufferControl from './BufferControl';
import WhereToOpenPanel from './WhereToOpenPanel';
import RankingList from '@/components/dashboard/RankingList';
import { loadCityStats } from '@/lib/data/loadLayers';
import type { CiudadStats } from '@/types/denue';

type Tab = 'espacial' | 'rankings' | 'donde-abrir';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'espacial', label: 'Análisis', icon: Layers },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'donde-abrir', label: '¿Dónde abrir?', icon: Sparkle },
];

export default function AnalysisDrawer() {
  const [abierto, setAbierto] = useState(true);
  const [tab, setTab] = useState<Tab>('espacial');
  const [stats, setStats] = useState<CiudadStats | null>(null);

  useEffect(() => {
    loadCityStats().then(setStats);
  }, []);

  return (
    <div className="flex items-start gap-2">
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 320 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl bg-white/95 backdrop-blur-md shadow-lg shadow-mm-carbon/10 border border-mm-taupe overflow-hidden"
          >
            <div className="w-80 p-4">
              <div className="flex items-center gap-1 mb-4 bg-mm-taupe/40 rounded-xl p-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                      tab === id ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'espacial' && (
                <div className="space-y-2.5">
                  <HeatmapControl />
                  <H3HexControl />
                  <ClusterControl />
                  <BufferControl />
                  <div className="flex items-center gap-1.5 text-[11px] text-mm-taupe-dark px-1">
                    <BarChart3 size={12} />
                    Clic en un negocio del mapa para radio de competencia (100/250/500 m).
                  </div>
                </div>
              )}

              {tab === 'rankings' && stats && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-mm-taupe-dark mb-2">
                      Top 20 colonias
                    </h3>
                    <RankingList
                      items={stats.topColonias.slice(0, 8).map((c) => ({
                        label: c.colonia,
                        sublabel: c.alcaldia,
                        value: c.total,
                      }))}
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-mm-taupe-dark mb-2">
                      Ranking de alcaldías
                    </h3>
                    <RankingList
                      items={stats.topAlcaldias.slice(0, 8).map((a) => ({ label: a.alcaldia, value: a.total }))}
                      accentColor="#C4634A"
                    />
                  </div>
                  <a
                    href="/dashboard"
                    className="block text-center text-xs font-semibold rounded-xl bg-mm-carbon text-mm-bone py-2.5 hover:bg-mm-carbon-light transition-colors"
                  >
                    Ver dashboard completo
                  </a>
                </div>
              )}

              {tab === 'donde-abrir' && <WhereToOpenPanel />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setAbierto(!abierto)}
        className="rounded-xl bg-white/95 backdrop-blur-md shadow-lg shadow-mm-carbon/10 border border-mm-taupe p-2 hover:bg-mm-taupe/40 transition-colors shrink-0"
      >
        {abierto ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </div>
  );
}
