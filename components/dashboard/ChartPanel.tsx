'use client';

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { GIRO_CONFIG, type Giro } from '@/types/denue';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend);

const FONT = { family: 'Inter, ui-sans-serif, system-ui, sans-serif', size: 11 };

export function MixDeGirosChart({
  giros,
  totalPorGiro,
}: {
  giros: Giro[];
  totalPorGiro: Partial<Record<Giro, number>>;
}) {
  return (
    <Doughnut
      data={{
        labels: giros.map((g) => GIRO_CONFIG[g].label),
        datasets: [
          {
            data: giros.map((g) => totalPorGiro[g] ?? 0),
            backgroundColor: giros.map((g) => GIRO_CONFIG[g].color),
            borderColor: '#FAFAF7',
            borderWidth: 2,
          },
        ],
      }}
      options={{
        plugins: { legend: { position: 'bottom', labels: { font: FONT, boxWidth: 10, padding: 12 } } },
        cutout: '62%',
      }}
    />
  );
}

export function RankingBarChart({
  labels,
  values,
  color = '#F0D264',
}: {
  labels: string[];
  values: number[];
  color?: string;
}) {
  return (
    <Bar
      data={{
        labels,
        datasets: [{ data: values, backgroundColor: color, borderRadius: 6, barThickness: 14 }],
      }}
      options={{
        indexAxis: 'y' as const,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: '#E8E2D9' }, ticks: { font: FONT } },
          y: { grid: { display: false }, ticks: { font: FONT } },
        },
      }}
    />
  );
}

export function AltasPorAnioChart({ anios, valores }: { anios: string[]; valores: number[] }) {
  return (
    <Line
      data={{
        labels: anios,
        datasets: [
          {
            data: valores,
            borderColor: '#2E2A26',
            backgroundColor: '#F0D26433',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#F0D264',
            pointRadius: 4,
          },
        ],
      }}
      options={{
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: FONT } },
          y: { grid: { color: '#E8E2D9' }, ticks: { font: FONT } },
        },
      }}
    />
  );
}
