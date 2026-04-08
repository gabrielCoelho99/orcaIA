import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrcaIA — Orçamentos Inteligentes",
  description: "Gere orçamentos profissionais em segundos com inteligência artificial. Ideal para oficinas, pedreiros, eletricistas e prestadores de serviço.",
  keywords: ["orçamento", "IA", "inteligência artificial", "prestação de serviço", "PDF", "orçamento online"],
  authors: [{ name: "OrcaIA" }],
  openGraph: {
    title: "OrcaIA — Orçamentos Inteligentes",
    description: "Gere orçamentos profissionais em segundos com IA.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F1419",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

