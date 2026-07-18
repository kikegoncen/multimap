import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Flame, Hexagon, Sparkle, Radar, Store } from 'lucide-react';

const FEATURES = [
  {
    icon: Flame,
    title: 'Mapa de densidad',
    desc: 'Visualiza en tiempo real dónde se concentran farmacias, cafeterías, minisupers, ópticas y perfumerías en toda la CDMX.',
  },
  {
    icon: Hexagon,
    title: 'Índice de Saturación Comercial',
    desc: 'Un indicador propio que clasifica cada zona de la ciudad de Muy Baja a Muy Alta saturación, por hexágono H3.',
  },
  {
    icon: Sparkle,
    title: 'Índice de Oportunidad Multimap',
    desc: 'Score 0-100 que combina densidad, competencia, distancia y diversidad comercial en una sola métrica accionable.',
  },
  {
    icon: Radar,
    title: 'Radio de competencia',
    desc: 'Selecciona cualquier negocio y descubre cuántos competidores tiene a 100, 250 y 500 metros.',
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden bg-mm-carbon text-mm-bone px-6">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, #F0D264 0, transparent 35%), radial-gradient(circle at 80% 70%, #A8998A 0, transparent 40%)',
          }}
        />
        <Image
          src="/logo-multimap.png"
          alt="Multimap"
          width={96}
          height={96}
          className="relative rounded-2xl mb-6 shadow-2xl shadow-black/40"
        />
        <h1 className="relative text-center text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.1]">
          Los 5 negocios más rentables de la <span className="text-mm-mustard">Ciudad de México</span>
        </h1>
        <p className="relative text-center text-mm-taupe-dark text-lg mt-5 max-w-xl">
          Geomarketing para todos. Datos reales del censo económico, analizados con algoritmos espaciales reales.
        </p>

        <div className="relative flex flex-col sm:flex-row items-center gap-3 mt-8">
          <Link
            href="/mapa"
            className="flex items-center gap-2 rounded-xl bg-mm-mustard text-mm-carbon font-bold px-6 py-3.5 hover:brightness-95 transition-all shadow-lg shadow-mm-mustard/20"
          >
            Descubre dónde invertir <ArrowRight size={18} />
          </Link>
          <Link
            href="/mapa"
            className="flex items-center gap-2 rounded-xl border border-white/20 text-mm-bone font-semibold px-6 py-3.5 hover:bg-white/10 transition-colors"
          >
            <Sparkle size={16} className="text-mm-mustard" /> ¿Abrirías aquí?
          </Link>
        </div>

        <p className="relative text-xs text-mm-taupe-dark mt-10 uppercase tracking-widest">
          29,325 establecimientos · 16 alcaldías · 5 giros comerciales
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="text-center text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
          Análisis antes de invertir
        </h2>
        <p className="text-center text-mm-taupe-dark max-w-xl mx-auto mb-14">
          Los datos cuentan la historia. Multimap traduce miles de puntos en decisiones claras de negocio.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-mm-taupe p-6 hover:shadow-lg hover:shadow-mm-carbon/5 transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-mm-mustard/20 text-mm-mustard-dark flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-bold mb-1.5">{title}</h3>
              <p className="text-sm text-mm-taupe-dark leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mm-taupe/40 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Store size={28} className="mx-auto mb-4 text-mm-carbon" />
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            Geomarketing, Análisis Espacial y GeoAI, en un solo mapa
          </h2>
          <p className="text-mm-taupe-dark mb-8">
            Multimap es la referencia en Business Intelligence Territorial en México. Este geovisor es gratuito y
            se comparte abiertamente para que empresarios, inversionistas y curiosos exploren la ciudad con datos reales.
          </p>
          <Link
            href="/mapa"
            className="inline-flex items-center gap-2 rounded-xl bg-mm-carbon text-mm-bone font-bold px-7 py-3.5 hover:bg-mm-carbon-light transition-colors"
          >
            Explorar el mapa <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <footer className="py-8 text-center text-xs text-mm-taupe-dark">
        © {new Date().getFullYear()} Multimap · 2D & 3D Map Generation · Datos: DENUE / INEGI
      </footer>
    </main>
  );
}
