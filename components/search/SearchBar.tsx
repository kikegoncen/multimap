'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, MapPin, Building2, Store } from 'lucide-react';
import { useMapModeStore } from '@/stores/useMapModeStore';
import { loadGiroLayer } from '@/lib/data/loadLayers';
import { GIRO_CONFIG, type Establecimiento, type Giro } from '@/types/denue';

type Resultado =
  | { tipo: 'establecimiento'; est: Establecimiento }
  | { tipo: 'colonia'; nombre: string; alcaldia: string; centro: [number, number] }
  | { tipo: 'alcaldia'; nombre: string; centro: [number, number] };

const GIROS: Giro[] = ['farmacia', 'cafeteria', 'minisuper', 'optica', 'perfumeria'];

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [todos, setTodos] = useState<Establecimiento[]>([]);
  const setFeatureSeleccionado = useMapModeStore((s) => s.setFeatureSeleccionado);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all(GIROS.map((g) => loadGiroLayer(g))).then((colecciones) => {
      setTodos(colecciones.flatMap((c) => c.features.map((f) => f.properties)));
    });
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const resultados: Resultado[] = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (q.length < 2 || todos.length === 0) return [];

    const porColonia = new Map<string, Establecimiento[]>();
    const porAlcaldia = new Map<string, Establecimiento[]>();
    for (const e of todos) {
      if (!porColonia.has(e.colonia)) porColonia.set(e.colonia, []);
      porColonia.get(e.colonia)!.push(e);
      if (!porAlcaldia.has(e.alcaldia)) porAlcaldia.set(e.alcaldia, []);
      porAlcaldia.get(e.alcaldia)!.push(e);
    }

    const resAlcaldias: Resultado[] = [...porAlcaldia.entries()]
      .filter(([nombre]) => nombre.toUpperCase().includes(q))
      .slice(0, 3)
      .map(([nombre, ests]) => ({
        tipo: 'alcaldia' as const,
        nombre,
        centro: [ests[0].lng, ests[0].lat] as [number, number],
      }));

    const resColonias: Resultado[] = [...porColonia.entries()]
      .filter(([nombre]) => nombre.toUpperCase().includes(q))
      .slice(0, 4)
      .map(([nombre, ests]) => ({
        tipo: 'colonia' as const,
        nombre,
        alcaldia: ests[0].alcaldia,
        centro: [ests[0].lng, ests[0].lat] as [number, number],
      }));

    const resEstablecimientos: Resultado[] = todos
      .filter((e) => e.nombre.toUpperCase().includes(q))
      .slice(0, 6)
      .map((est) => ({ tipo: 'establecimiento' as const, est }));

    return [...resAlcaldias, ...resColonias, ...resEstablecimientos].slice(0, 10);
  }, [query, todos]);

  function seleccionar(r: Resultado) {
    if (r.tipo === 'establecimiento') {
      setFeatureSeleccionado(r.est);
    } else {
      // Para colonia/alcaldía, seleccionamos un establecimiento representativo
      // para reutilizar el flujo de "volar hacia" del mapa.
      const repEst = todos.find((e) =>
        r.tipo === 'colonia' ? e.colonia === r.nombre : e.alcaldia === r.nombre,
      );
      if (repEst) setFeatureSeleccionado(repEst);
    }
    setQuery(r.tipo === 'establecimiento' ? r.est.nombre : r.nombre);
    setAbierto(false);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg shadow-mm-carbon/10 border border-mm-taupe px-4 py-2.5">
        <Search size={16} className="text-mm-taupe-dark shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder="Busca colonia, alcaldía o establecimiento…"
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-mm-taupe-dark"
        />
      </div>

      {abierto && resultados.length > 0 && (
        <div className="absolute mt-2 w-full rounded-2xl bg-white shadow-xl shadow-mm-carbon/15 border border-mm-taupe overflow-hidden max-h-80 overflow-y-auto z-10">
          {resultados.map((r, i) => (
            <button
              key={i}
              onClick={() => seleccionar(r)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-mm-taupe/40 text-left transition-colors"
            >
              {r.tipo === 'alcaldia' && <Building2 size={15} className="text-mm-taupe-dark shrink-0" />}
              {r.tipo === 'colonia' && <MapPin size={15} className="text-mm-taupe-dark shrink-0" />}
              {r.tipo === 'establecimiento' && <Store size={15} className="text-mm-taupe-dark shrink-0" />}
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {r.tipo === 'establecimiento' ? r.est.nombre : r.nombre}
                </div>
                <div className="text-xs text-mm-taupe-dark truncate">
                  {r.tipo === 'alcaldia' && 'Alcaldía'}
                  {r.tipo === 'colonia' && `Colonia · ${r.alcaldia}`}
                  {r.tipo === 'establecimiento' && `${GIRO_CONFIG[r.est.giro].label} · ${r.est.colonia}`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
