import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Instituto Técnico Industrial - San Pedro Sacatepéquez, San Marcos",
  description: "Instituto Técnico Industrial Adscrito al INEB, Jornada Vespertina. Formación académica, técnica y ocupacional de calidad. Carreras en Computación, Dibujo de Construcción, Costura Industrial, Electricidad y Mecánica Automotriz.",
  keywords: ["Instituto Técnico Industrial", "San Pedro Sacatepéquez", "San Marcos", "Bachillerato Industrial", "Perito", "Educación Técnica", "Carreras Técnicas"],
  authors: [{ name: "Instituto Técnico Industrial" }],
  icons: {
    icon: "/institucional/logo.jpeg",
  },
  openGraph: {
    title: "Instituto Técnico Industrial",
    description: "Solo la calidad nos hace competitivos",
    siteName: "Instituto Técnico Industrial",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
