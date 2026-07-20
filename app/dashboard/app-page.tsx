'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Store, MapPin, TrendingUp, Layers } from 'lucide-react';
import KPICard from '@/components/dashboard/KPICard';
import RankingList from '@/components/dashboard/RankingList';
import GiroSelector from '@/components/dashboard/GiroSelector';
import { MixDeGirosChart, RankingBarChart, AltasPorAnioChart } from '@/components/dashboard/ChartPanel';
import { loadGiroLayer } from '@/lib/data/loadLayers';
import { calcularAgregados } from '@/lib/data/dashboardAggregates';
import { GIRO_CONFIG, type Establecimiento, type Giro } from '@/types/denue';

const TODOS_LOS_GIROS = Object.keys(GIRO_CONFIG) as Giro[];

export default function DashboardPage() {
  const [girosSeleccionados, setGirosSeleccionados] = useState<Giro[]>(TODOS_LOS_GIROS);
  const [establecimientosPorGiro, setEstablecimientosPorGiro] = useState<
    Partial<Record<Giro, Establecimiento[]>>
  >({});

  // Carga bajo demanda: sólo pide al servidor los GeoJSON de los giros que
  // aún no tenemos en memoria (loadGiroLayer ya cachea por URL internamente).
  useEffect(() => {
    const faltantes = girosSeleccionados.filter((g) => !establecimientosPorGiro[g]);
    if (faltantes.length === 0) return;
    Promise.all(faltantes.map((g) => loadGiroLayer(g))).then((resultados) => {
      setEstablecimientosPorGiro((prev) => {
        const next = { ...prev };
        faltantes.forEach((g, i) => {
          next[g] = resultados[i].features.map((f) => f.properties);
        });
        return next;
      });
    });
  }, [girosSeleccionados]); // eslint-disable-line react-hooks/exhaustive-deps

  const agregados = useMemo(() => {
    const listos = girosSeleccionados.every((g) => establecimientosPorGiro[g]);
    if (!listos) return null;
    return calcularAgregados(establecimientosPorGiro, girosSeleccionados);
  }, [establecimientosPorGiro, girosSeleccionados]);

  const etiquetaSeleccion =
    girosSeleccionados.length === TODOS_LOS_GIROS.length
      ? '5 giros DENUE · CDMX'
      : girosSeleccionados.map((g) => GIRO_CONFIG[g].label).join(' + ');

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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div className="rounded-2xl bg-white border border-mm-taupe p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Layers size={14} className="text-mm-taupe-dark" />
            <h2 className="text-xs font-bold uppercase tracking-wide text-mm-taupe-dark">
              Giros a mostrar
            </h2>
          </div>
          <GiroSelector seleccionados={girosSeleccionados} onChange={setGirosSeleccionados} />
        </div>

        {!agregados ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-mm-taupe/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Establecimientos totales"
                value={agregados.total.toLocaleString('es-MX')}
                sublabel={etiquetaSeleccion}
                icon={<Store size={15} />}
                accentColor="#F0D264"
              />
              <KPICard
                label="Colonia líder"
                value={agregados.topColonias[0]?.colonia ?? '—'}
                sublabel={`${agregados.topColonias[0]?.total.toLocaleString('es-MX') ?? 0} establecimientos`}
                icon={<MapPin size={15} />}
                accentColor="#A8998A"
              />
              <KPICard
                label="Alcaldía líder"
                value={agregados.topAlcaldias[0]?.alcaldia ?? '—'}
                sublabel={`${agregados.topAlcaldias[0]?.total.toLocaleString('es-MX') ?? 0} establecimientos`}
                icon={<MapPin size={15} />}
                accentColor="#C4634A"
              />
              {agregados.giroDominante ? (
                <KPICard
                  label="Giro dominante en la selección"
                  value={GIRO_CONFIG[agregados.giroDominante.giro].label}
                  sublabel={`${agregados.giroDominante.total.toLocaleString('es-MX')} establecimientos`}
                  icon={<TrendingUp size={15} />}
                  accentColor="#5FA878"
                />
              ) : (
                <KPICard
                  label="Participación en CDMX"
                  value={GIRO_CONFIG[girosSeleccionados[0]].label}
                  sublabel="Único giro seleccionado"
                  icon={<TrendingUp size={15} />}
                  accentColor="#5FA878"
                />
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {girosSeleccionados.length > 1 && (
                <div className="md:col-span-1 rounded-2xl bg-white border border-mm-taupe p-5">
                  <h2 className="text-sm font-bold mb-4">Mix de giros seleccionados</h2>
                  <div className="h-64">
                    <MixDeGirosChart giros={girosSeleccionados} totalPorGiro={agregados.totalPorGiroSeleccionado} />
                  </div>
                </div>
              )}

              <div className={girosSeleccionados.length > 1 ? 'md:col-span-2' : 'md:col-span-3'}>
                <div className="rounded-2xl bg-white border border-mm-taupe p-5 h-full">
                  <h2 className="text-sm font-bold mb-4">Top 10 alcaldías por número de establecimientos</h2>
                  <div className="h-64">
                    <RankingBarChart
                      labels={agregados.topAlcaldias.slice(0, 10).map((a) => a.alcaldia)}
                      values={agregados.topAlcaldias.slice(0, 10).map((a) => a.total)}
                      color="#C4634A"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-2xl bg-white border border-mm-taupe p-5">
                <h2 className="text-sm font-bold mb-1">Top 20 colonias</h2>
                <p className="text-xs text-mm-taupe-dark mb-4">
                  {girosSeleccionados.length === TODOS_LOS_GIROS.length
                    ? 'Concentración de los 5 giros combinados'
                    : `Concentración de: ${etiquetaSeleccion}`}
                </p>
                <RankingList
                  items={agregados.topColonias.map((c) => ({ label: c.colonia, sublabel: c.alcaldia, value: c.total }))}
                />
              </div>

              <div className="rounded-2xl bg-white border border-mm-taupe p-5">
                <h2 className="text-sm font-bold mb-1">Altas por año</h2>
                <p className="text-xs text-mm-taupe-dark mb-4">Registro DENUE, campo fecha_alta</p>
                <div className="h-56">
                  <AltasPorAnioChart
                    anios={agregados.altasPorAnio.map((a) => a.anio)}
                    valores={agregados.altasPorAnio.map((a) => a.total)}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
