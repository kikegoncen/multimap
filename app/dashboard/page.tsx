'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Store, MapPin, Flame, TrendingUp } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import RankingList from '@/components/dashboard/RankingList';
import { MixDeGirosChart, RankingBarChart, AltasPorAnioChart } from '@/components/dashboard/ChartPanel';
import { loadCityStats } from '@/lib/data/loadLayers';
import type { CiudadStats } from '@/types/denue';

export default function DashboardPage() {
  const [stats, setStats] = useState<CiudadStats | null>(null);

  useEffect(() => {
    loadCityStats().then(setStats);
  }, []);

  return (
    <main className="min-h-screen bg-mm-bone">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-mm-taupe">
        <div className="flex items-center gap-3">
          <Link href="/mapa" className="p-2 rounded-lg hover:bg-mm-taupe/50 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Image src="/logo-multimap.png" alt="Multimap" width={28} height={28} className="rounded-md" />
          <h1 className="font-extrabold text-lg tracking-tight">Dashboard de Geomarketing</h1>
        </div>
        <Link
          href="/mapa"
          className="text-xs font-semibold rounded-xl bg-mm-carbon text-mm-bone px-4 py-2 hover:bg-mm-carbon-light transition-colors"
        >
          Ir al geovisor
        </Link>
      </header>

      {!stats ? (
        <div className="p-10 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-mm-taupe/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              label="Establecimientos totales"
              value={stats.totalGeneral.toLocaleString('es-MX')}
              sublabel="5 giros DENUE · CDMX"
              icon={<Store size={15} />}
              accentColor="#F0D264"
            />
            <KPICard
              label="Colonia líder"
              value={stats.topColonias[0]?.colonia ?? '—'}
              sublabel={`${stats.topColonias[0]?.total.toLocaleString('es-MX')} establecimientos`}
              icon={<MapPin size={15} />}
              accentColor="#A8998A"
            />
            <KPICard
              label="Alcaldía más saturada"
              value={stats.alcaldiaMasSaturada.alcaldia}
              sublabel={`ISC promedio ${stats.alcaldiaMasSaturada.isc}`}
              icon={<Flame size={15} />}
              accentColor="#C4634A"
            />
            <KPICard
              label="Mayor oportunidad (IOM)"
              value={stats.alcaldiaMayorOportunidad.alcaldia}
              sublabel={`IOM promedio ${stats.alcaldiaMayorOportunidad.iom}`}
              icon={<TrendingUp size={15} />}
              accentColor="#5FA878"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-1 rounded-2xl bg-white border border-mm-taupe p-5">
              <h2 className="text-sm font-bold mb-4">Mix de giros</h2>
              <div className="h-64"><MixDeGirosChart totalPorGiro={stats.totalPorGiro} /></div>
            </div>

            <div className="md:col-span-2 rounded-2xl bg-white border border-mm-taupe p-5">
              <h2 className="text-sm font-bold mb-4">Top 10 alcaldías por número de establecimientos</h2>
              <div className="h-64">
                <RankingBarChart
                  labels={stats.topAlcaldias.slice(0, 10).map((a) => a.alcaldia)}
                  values={stats.topAlcaldias.slice(0, 10).map((a) => a.total)}
                  color="#C4634A"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 rounded-2xl bg-white border border-mm-taupe p-5">
              <h2 className="text-sm font-bold mb-1">Top 20 colonias</h2>
              <p className="text-xs text-mm-taupe-dark mb-4">Concentración de los 5 giros combinados</p>
              <RankingList items={stats.topColonias.map((c) => ({ label: c.colonia, sublabel: c.alcaldia, value: c.total }))} />
            </div>

            <div className="rounded-2xl bg-white border border-mm-taupe p-5">
              <h2 className="text-sm font-bold mb-1">Altas por año</h2>
              <p className="text-xs text-mm-taupe-dark mb-4">Registro DENUE, campo fecha_alta</p>
              <div className="h-56">
                <AltasPorAnioChart
                  anios={stats.altasPorAnio.map((a) => a.anio)}
                  valores={stats.altasPorAnio.map((a) => a.total)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
