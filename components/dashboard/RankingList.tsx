'use client';

interface RankingItem {
  label: string;
  sublabel?: string;
  value: number;
}

interface RankingListProps {
  items: RankingItem[];
  accentColor?: string;
}

export default function RankingList({ items, accentColor = '#F0D264' }: RankingListProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={`${item.label}-${i}`} className="flex items-center gap-3">
          <span className="w-5 text-xs font-bold text-mm-taupe-dark shrink-0 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium truncate">{item.label}</span>
              <span className="text-xs font-semibold tabular-nums shrink-0">{item.value.toLocaleString('es-MX')}</span>
            </div>
            {item.sublabel && <div className="text-[11px] text-mm-taupe-dark truncate">{item.sublabel}</div>}
            <div className="h-1.5 rounded-full bg-mm-taupe/50 mt-1 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
