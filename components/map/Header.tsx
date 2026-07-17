'use client';

import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';
import SearchBar from '@/components/search/SearchBar';

export default function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-4 px-4 py-3 pointer-events-none">
      <Link href="/" className="flex items-center gap-2 pointer-events-auto">
        <div className="rounded-xl bg-mm-carbon p-1.5 shadow-lg shadow-mm-carbon/20">
          <Image src="/logo-multimap.png" alt="Multimap" width={28} height={28} className="rounded-md" />
        </div>
        <span className="hidden sm:block font-extrabold tracking-tight text-mm-carbon text-lg">
          MULTIMAP
        </span>
      </Link>

      <div className="pointer-events-auto flex-1 flex justify-center max-w-md">
        <SearchBar />
      </div>

      <Link
        href="/dashboard"
        className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg shadow-mm-carbon/10 border border-mm-taupe px-3 py-2.5 text-xs font-semibold hover:bg-mm-taupe/50 transition-colors"
      >
        <LayoutDashboard size={14} />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
    </header>
  );
}
