import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from 'sonner';
import { EscenariosProvider } from "@/context/escenarios-context";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Calculadora de Retiro",
  description: "Calcula el rendimiento de tus inversiones para garantizar un retiro cómodo según tu estilo de vida deseado",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <EscenariosProvider>
          {children}
          <Toaster richColors position="bottom-right" closeButton />
        </EscenariosProvider>
      </body>
    </html>
  );
}
