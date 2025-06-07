"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  PiggyBank,
  FileText,
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar as RechartsBar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useEscenarios, type Escenario } from "@/context/escenarios-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

function GraficosEscenarioContent() {
  const searchParams = useSearchParams()
  const escenarioId = searchParams?.get('escenario')
  const { escenarios } = useEscenarios()
  const router = useRouter()
  const [escenario, setEscenario] = useState<Escenario | null>(null)
  const [tipoGrafico, setTipoGrafico] = useState<'lineas' | 'barras' | 'circular'>('lineas')

  useEffect(() => {
    if (escenarioId && escenarios.length > 0) {
      const escenarioEncontrado = escenarios.find(e => e.id === escenarioId)
      setEscenario(escenarioEncontrado || null)
    }
  }, [escenarioId, escenarios])

  if (!escenario) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-4">
            <Link href="/comparador">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al comparador
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="pt-6 text-center">
              <PiggyBank className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 mb-4">Escenario no encontrado</p>
              <Link href="/comparador">
                <Button>Volver al comparador</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const formatearNumero = (numero: number) => {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(numero)
  }

  const prepararDatosGrafico = () => {
    if (!escenario?.crecimientoPorAnio) return []
    
    return escenario.crecimientoPorAnio.map((monto, index) => ({
      año: index,
      edad: escenario.edadActual + index,
      monto: monto,
      inversión: index === 0 ? escenario.montoInicial : escenario.aportacionMensual * 12,
      rendimiento: index === 0 ? 0 : monto - (escenario.crecimientoPorAnio![index - 1] || 0) - (escenario.aportacionMensual * 12),
    }))
  }

  const prepararDatosCircular = () => {
    if (!escenario) return []
    
    const montoFinal = escenario.resultado || 0
    const inversionTotal = escenario.montoInicial + (escenario.aportacionMensual * 12 * escenario.plazoAnios)
    const ganancias = montoFinal - inversionTotal
    
    return [
      {
        name: 'Capital Inicial',
        value: escenario.montoInicial,
        color: '#3b82f6'
      },
      {
        name: 'Aportes Acumulados',
        value: escenario.aportacionMensual * 12 * escenario.plazoAnios,
        color: '#06b6d4'
      },
      {
        name: 'Ganancias por Rendimiento',
        value: ganancias,
        color: '#10b981'
      }
    ]
  }

  const renderizarGrafico = () => {
    const datos = prepararDatosGrafico()
    
    switch (tipoGrafico) {
      case 'lineas':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={datos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="edad" 
                label={{ value: 'Edad (años)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Monto ($)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `$${formatearNumero(value)}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${formatearNumero(value)}`, 'Monto total']}
                labelFormatter={(edad) => `Edad: ${edad} años`}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="monto" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Monto acumulado"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'barras':
        // Mostrar solo cada 5 años para mejor visualización
        const datosReducidos = datos.filter((_, index) => index % 5 === 0 || index === datos.length - 1)
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={datosReducidos} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="edad" 
                label={{ value: 'Edad (años)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                label={{ value: 'Monto ($)', angle: -90, position: 'insideLeft' }}
                tickFormatter={(value) => `$${formatearNumero(value)}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${formatearNumero(value)}`, 'Monto total']}
                labelFormatter={(edad) => `Edad: ${edad} años`}
              />
              <Legend />
              <RechartsBar 
                dataKey="monto" 
                fill="#3b82f6"
                name="Monto acumulado"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'circular':
        const datosCirculares = prepararDatosCircular()
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={datosCirculares}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {datosCirculares.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`$${formatearNumero(value)}`]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center mb-4">
              <PiggyBank className="h-10 w-10 text-primary mr-2" />
              <h1 className="text-3xl font-bold text-slate-900">
                <span className="font-black">MiRetiro</span>
              </h1>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Gráficos de Proyección</h1>
            <p className="text-slate-600">
              Visualización detallada del escenario: <span className="font-semibold">{escenario.nombre}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/comparador">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al comparador
              </Button>
            </Link>
            <Button 
              className="gap-2"
              onClick={() => router.push(`/pdf?escenario=${escenarioId}`)}
            >
              <FileText className="h-4 w-4" />
              Generar reporte
            </Button>
          </div>
        </div>

        {/* Información del escenario */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${escenario.color}`}></div>
              {escenario.nombre}
            </CardTitle>
            <CardDescription>Parámetros del escenario de inversión</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-blue-600 font-medium">Capital Inicial</div>
                <div className="text-xl font-bold text-blue-900">${formatearNumero(escenario.montoInicial)}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-green-600 font-medium">Aporte Mensual</div>
                <div className="text-xl font-bold text-green-900">${formatearNumero(escenario.aportacionMensual)}</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-purple-600 font-medium">Rendimiento</div>
                <div className="text-xl font-bold text-purple-900">{escenario.tasaInteres}%</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <Percent className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <div className="text-sm text-amber-600 font-medium">Inflación</div>
                <div className="text-xl font-bold text-amber-900">{escenario.inflacion}%</div>
              </div>
            </div>
            
            <div className="mt-6 text-center p-6 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-500 mb-2">Monto Final Estimado</div>
              <div className="text-4xl font-bold text-slate-900">${formatearNumero(escenario.resultado || 0)}</div>
              <div className="text-sm text-slate-500 mt-2">
                A los {escenario.edadRetiro} años ({escenario.plazoAnios} años de inversión)
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controles de gráficos */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
            <Button 
              variant={tipoGrafico === 'lineas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTipoGrafico('lineas')}
            >
              <LineChartIcon className="mr-2 h-4 w-4" />
              Líneas
            </Button>
            <Button 
              variant={tipoGrafico === 'barras' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTipoGrafico('barras')}
            >
              <BarChartIcon className="mr-2 h-4 w-4" />
              Barras
            </Button>
            <Button 
              variant={tipoGrafico === 'circular' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTipoGrafico('circular')}
            >
              <PiggyBank className="mr-2 h-4 w-4" />
              Composición
            </Button>
          </div>
        </div>

        {/* Gráfico principal */}
        <Card>
          <CardHeader>
            <CardTitle>
              {tipoGrafico === 'lineas' && 'Evolución del Capital a lo Largo del Tiempo'}
              {tipoGrafico === 'barras' && 'Crecimiento del Capital (cada 5 años)'}
              {tipoGrafico === 'circular' && 'Composición del Monto Final'}
            </CardTitle>
            <CardDescription>
              {tipoGrafico === 'lineas' && 'Muestra cómo crece tu inversión año tras año'}
              {tipoGrafico === 'barras' && 'Visualización del monto acumulado en intervalos de 5 años'}
              {tipoGrafico === 'circular' && 'Desglose de capital inicial, aportes y ganancias'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-auto">
              {renderizarGrafico()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function GraficosEscenario() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <PiggyBank className="h-16 w-16 text-slate-400 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-500">Cargando...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <GraficosEscenarioContent />
    </Suspense>
  )
} 