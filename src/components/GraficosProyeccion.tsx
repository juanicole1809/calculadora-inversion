'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, Cell, TooltipProps, AreaChart, Area } from 'recharts'
import { TooltipContent } from '@radix-ui/react-tooltip'

// Interfaces para los tipos de datos
interface ResultadosData {
  montoFinal: number
  aportesTotales: number
  rendimientoTotal: number
  proyeccionAnual: Array<{
    año: number
    saldo: number
    aportesAcumulados: number
    rendimientoAcumulado: number
  }>
}

interface GraficosProyeccionProps {
  resultados: ResultadosData
}

// Componente para los gráficos
export function GraficosProyeccion({ resultados }: GraficosProyeccionProps) {
  const [tipoGrafico, setTipoGrafico] = useState<'saldo' | 'composicion'>('saldo')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Función para formatear moneda
  const formatCurrency = (number: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number)
  }

  // Preparar datos para el gráfico de composición (pie chart)
  const datosComposicion = [
    { name: 'Capital Aportado', value: resultados.aportesTotales, color: '#2563eb' },
    { name: 'Rendimiento Obtenido', value: resultados.rendimientoTotal, color: '#16a34a' }
  ]

  // Preparar datos para el gráfico de saldo por año
  const datosSaldo = resultados.proyeccionAnual.map((item) => ({
    año: item.año,
    saldo: item.saldo,
    aportes: item.aportesAcumulados,
    rendimiento: item.rendimientoAcumulado
  }))

  // Personalizar el tooltip para mostrar valores monetarios
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      if (tipoGrafico === 'saldo') {
        return (
          <div className="bg-white p-3 border border-stone-200 shadow-md rounded-md">
            <p className="text-sm font-medium mb-1">Año {label}</p>
            {payload.map((entry, index) => (
              <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
                <span className="font-medium">{entry.name}:</span> {formatCurrency(entry.value as number)}
              </p>
            ))}
          </div>
        )
      } else {
        return (
          <div className="bg-white p-3 border border-stone-200 shadow-md rounded-md">
            <p className="text-sm font-medium">{payload[0].name}</p>
            <p className="text-sm font-medium">{formatCurrency(payload[0].value as number)}</p>
            <p className="text-xs text-stone-500">
              ({Math.round((payload[0].value as number) / resultados.montoFinal * 100)}% del total)
            </p>
          </div>
        )
      }
    }
    return null
  }

  return (
    <>
      <Button 
        variant="outline"
        className="w-full sm:flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
        onClick={() => setIsDialogOpen(true)}
      >
        Ver Gráficos
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gráficos de Proyección</DialogTitle>
            <DialogDescription>
              Visualización de tu plan de inversión a lo largo del tiempo
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <Button
              variant={tipoGrafico === 'saldo' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoGrafico('saldo')}
              className={tipoGrafico === 'saldo' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Saldo Total
            </Button>
            <Button
              variant={tipoGrafico === 'composicion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipoGrafico('composicion')}
              className={tipoGrafico === 'composicion' ? 'bg-blue-600 hover:bg-blue-700' : ''}
            >
              Composición
            </Button>
          </div>
          
          <div className="h-80 w-full">
            {tipoGrafico === 'saldo' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={datosSaldo}
                  margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="año" 
                    tickFormatter={(value) => `${value}`}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis 
                    width={60}
                    domain={[0, 'auto']}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="aportes"
                    name="Capital Aportado"
                    stackId="1"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="rendimiento"
                    name="Rendimiento"
                    stackId="1"
                    stroke="#16a34a"
                    fill="#16a34a"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosComposicion}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {datosComposicion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="text-center text-sm text-stone-600 mt-2">
            {tipoGrafico === 'saldo' 
              ? 'Evolución del saldo de tu inversión a lo largo del tiempo' 
              : 'Distribución entre el capital aportado y el rendimiento generado'}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
