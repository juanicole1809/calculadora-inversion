import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Legend } from "recharts";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BarChart } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface GraficosProyeccionProps {
  resultados: {
    montoFinal: number;
    aportesTotales: number;
    rendimientoTotal: number;
    proyeccionAnual: Array<{
      año: number;
      saldo: number;
      aportesAcumulados: number;
      rendimientoAcumulado: number;
    }>;
  };
}

// Tooltip personalizado para mejorar la presentación
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    // Para el gráfico de composición, invertimos el orden (intereses arriba, capital abajo)
    // ya que en el gráfico el capital está abajo (verde) y los intereses arriba (azul)
    const payloadOrdered = [...payload];
    if (payload.length === 2 && payload[0].dataKey === "aportesAcumulados") {
      payloadOrdered.reverse();
    }
    
    return (
      <div className="bg-white p-3 border border-stone-200 rounded-lg shadow-sm">
        <p className="font-medium text-stone-800 mb-2">{`Año ${label}`}</p>
        {payloadOrdered.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center mb-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-stone-600">{entry.name}: </span>
            <span className="font-medium ml-1">{formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function GraficosProyeccion({ resultados }: GraficosProyeccionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
 
  // Formatear sin el símbolo de moneda para los ejes
  const formatCurrencyWithoutSymbol = (value: number) => {
    if (value === 0) return "0";
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };
 
  // Verificar si hay datos para mostrar
  if (!resultados.proyeccionAnual?.length) {
    console.warn('No hay datos de proyección para mostrar');
    return null;
  }
 
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2 bg-blue-50 text-blue-600 border-blue-600 hover:bg-blue-100">
          <BarChart className="w-4 h-4" />
          Ver Gráficos de Proyección
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Proyección de tu inversión</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance">Saldo Total</TabsTrigger>
              <TabsTrigger value="composition">Composición</TabsTrigger>
            </TabsList>
            <TabsContent value="balance" className="mt-4">
              <div className="h-[400px] w-full border border-stone-200 rounded-lg p-4">
                <div className="text-sm text-stone-600 mb-3">
                  <p>Este gráfico muestra la evolución del saldo total de tu inversión (capital aportado + intereses generados) a lo largo del tiempo.</p>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={resultados.proyeccionAnual}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="año" 
                      tickFormatter={(value) => `${value}`}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrencyWithoutSymbol(value)}
                      stroke="#6b7280"
                      width={60}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      content={<CustomTooltip formatter={formatCurrency} />}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                    />
                    <Line
                      type="monotone"
                      dataKey="saldo"
                      name="Saldo total"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="composition" className="mt-4">
              <div className="h-[400px] w-full border border-stone-200 rounded-lg p-4">
                <div className="text-sm text-stone-600 mb-3">
                  <p>Este gráfico muestra cómo se compone tu capital: lo que has aportado vs los intereses generados por la inversión.</p>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart
                    data={resultados.proyeccionAnual}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="año" 
                      tickFormatter={(value) => `${value}`}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrencyWithoutSymbol(value)}
                      stroke="#6b7280"
                      width={60}
                      domain={[0, 'auto']}
                    />
                    <Tooltip 
                      content={<CustomTooltip formatter={formatCurrency} />}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                    />
                    <Area
                      type="monotone"
                      dataKey="aportesAcumulados"
                      name="Capital aportado"
                      stackId="1"
                      stroke="#059669"
                      fill="#059669"
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="rendimientoAcumulado"
                      name="Intereses generados"
                      stackId="1"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
