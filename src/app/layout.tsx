import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { EscenariosProvider } from "@/context/escenarios-context";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "MiRetiro - Calculadora de Inversión para tu Retiro",
  description: "Planifica tu futuro financiero y descubre cómo alcanzar la independencia financiera",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <EscenariosProvider>
            {children}
            <Toaster richColors position="bottom-right" closeButton />
          </EscenariosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
