import type { Establecimiento, Giro } from '@/types/denue';

export interface DashboardAggregates {
  total: number;
  totalPorGiroSeleccionado: Record<Giro, number>;
  topColonias: { colonia: string; alcaldia: string; total: number }[];
  topAlcaldias: { alcaldia: string; total: number }[];
  altasPorAnio: { anio: string; total: number }[];
  giroDominante: { giro: Giro; total: number } | null;
}

function topN(map: Map<string, number>, n: number) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

/**
 * Calcula todos los agregados del dashboard a partir de los establecimientos
 * de los giros seleccionados. Se recalcula en cliente (en vez de depender de
 * city-stats.json, que sólo cubre el agregado de los 5 giros juntos) para
 * poder reaccionar a cualquier combinación de giros que elija el usuario.
 */
export function calcularAgregados(
  establecimientosPorGiro: Partial<Record<Giro, Establecimiento[]>>,
  girosSeleccionados: Giro[],
): DashboardAggregates {
  const todos = girosSeleccionados.flatMap((g) => establecimientosPorGiro[g] ?? []);

  const conteoColonia = new Map<string, number>();
  const conteoAlcaldia = new Map<string, number>();
  const coloniaAlcaldia = new Map<string, string>();
  const conteoAnio = new Map<string, number>();
  const totalPorGiroSeleccionado = Object.fromEntries(
    girosSeleccionados.map((g) => [g, (establecimientosPorGiro[g] ?? []).length]),
  ) as Record<Giro, number>;

  for (const est of todos) {
    conteoColonia.set(est.colonia, (conteoColonia.get(est.colonia) || 0) + 1);
    conteoAlcaldia.set(est.alcaldia, (conteoAlcaldia.get(est.alcaldia) || 0) + 1);
    if (!coloniaAlcaldia.has(est.colonia)) coloniaAlcaldia.set(est.colonia, est.alcaldia);

    const anio = (est.fechaAlta || '').slice(0, 4);
    if (anio) conteoAnio.set(anio, (conteoAnio.get(anio) || 0) + 1);
  }

  const giroDominante =
    girosSeleccionados.length > 1
      ? girosSeleccionados
          .map((g) => ({ giro: g, total: totalPorGiroSeleccionado[g] }))
          .sort((a, b) => b.total - a.total)[0]
      : null;

  return {
    total: todos.length,
    totalPorGiroSeleccionado,
    topColonias: topN(conteoColonia, 20).map(([colonia, total]) => ({
      colonia,
      alcaldia: coloniaAlcaldia.get(colonia) || '',
      total,
    })),
    topAlcaldias: topN(conteoAlcaldia, 16).map(([alcaldia, total]) => ({ alcaldia, total })),
    altasPorAnio: [...conteoAnio.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([anio, total]) => ({ anio, total })),
    giroDominante,
  };
}
