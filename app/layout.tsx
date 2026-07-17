import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multimap | Mapa de los Negocios Más Rentables de la Ciudad de México",
  description:
    "Geovisor de geomarketing de Multimap: explora la distribución de farmacias, cafeterías, tiendas de conveniencia, ópticas y perfumerías en la CDMX, con el Índice de Oportunidad Multimap (IOM) y el modo ¿Dónde abrir?.",
  keywords: [
    "geomarketing",
    "CDMX",
    "DENUE",
    "análisis espacial",
    "GIS",
    "Multimap",
    "dónde abrir un negocio",
  ],
  openGraph: {
    title: "Multimap | Mapa de los Negocios Más Rentables de la CDMX",
    description:
      "Descubre dónde invertir: geovisor de geomarketing con datos reales del DENUE (INEGI) y el Índice de Oportunidad Multimap.",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multimap | Geovisor de Geomarketing CDMX",
    description: "¿Abrirías aquí? Analiza antes de invertir.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-mm-bone text-mm-carbon">
        {children}
      </body>
    </html>
  );
}
