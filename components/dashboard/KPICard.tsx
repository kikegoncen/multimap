'use client';

import { motion } from 'framer-motion';

interface KPICardProps {
  label: string;
  value: string;
  sublabel?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export default function KPICard({ label, value, sublabel, accentColor = '#F0D264', icon }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white border border-mm-taupe p-5 shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-mm-taupe-dark">{label}</span>
        {icon && (
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
            {icon}
          </span>
        )}
      </div>
      <div className="text-3xl font-extrabold tabular-nums tracking-tight">{value}</div>
      {sublabel && <div className="text-xs text-mm-taupe-dark mt-1">{sublabel}</div>}
    </motion.div>
  );
}
