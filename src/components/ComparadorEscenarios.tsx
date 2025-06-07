"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PlusCircle,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Clock,
  Copy,
  ArrowLeft,
  CircleDollarSign,
  Percent,
  Calendar,
  PiggyBank,
  Download,
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
  Cell
} from 'recharts'
import { useEscenarios, type Escenario } from "@/context/escenarios-context"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Componente para menú de opciones en cada tarjeta de escenario
function EscenarioOptions({
  escenario,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  escenario: Escenario
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Cerrar el menú cuando se haga clic en alguna parte fuera del menú
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-menu-container]')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block text-left" data-menu-container>
      <div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8" 
          onClick={() => setIsOpen(!isOpen)}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            <button
              onClick={onEdit}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Editar</span>
            </button>
            <button
              onClick={onDuplicate}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy className="mr-2 h-4 w-4" />
              <span>Duplicar</span>
            </button>
            <button
              onClick={onDelete}
              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComparadorEscenarios() {
  const { escenarios, agregarEscenario, editarEscenario, eliminarEscenario, calcularResultado } = useEscenarios()
  const router = useRouter()
  const [escenarioActual, setEscenarioActual] = useState<Partial<Escenario> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditando, setIsEditando] = useState(false)
  const [activeTab, setActiveTab] = useState("escenarios")
  const [tipoGrafico, setTipoGrafico] = useState<'lineas' | 'barras'>('lineas')
  const [escenarioDetalle, setEscenarioDetalle] = useState<Escenario | null>(null)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false)

  // Formatear números para mostrar
  const formatearNumero = (numero: number) => {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(numero)
  }

  // Crear nuevo escenario
  const crearEscenario = () => {
    setIsEditando(false)
    setEscenarioActual({
      nombre: `Escenario ${escenarios.length + 1}`,
      montoInicial: 10000,
      aportacionMensual: 500,
      tasaInteres: 6,
      inflacion: 3.5,
      edadActual: 30,
      edadRetiro: 65,
      costoVidaMensual: 2000,
      plazoAnios: 35,
      actualizarAportePorInflacion: true,
    })
    setIsDialogOpen(true)
  }

  // Editar escenario existente
  const editarEscenarioExistente = (escenario: Escenario) => {
    setIsEditando(true)
    setEscenarioActual({ ...escenario })
    setIsDialogOpen(true)
  }

  // Duplicar escenario
  const duplicarEscenario = (escenario: Escenario) => {
    agregarEscenario({
      nombre: `${escenario.nombre} (copia)`,
      montoInicial: escenario.montoInicial,
      aportacionMensual: escenario.aportacionMensual,
      tasaInteres: escenario.tasaInteres,
      inflacion: escenario.inflacion,
      edadActual: escenario.edadActual,
      edadRetiro: escenario.edadRetiro,
      costoVidaMensual: escenario.costoVidaMensual,
      plazoAnios: escenario.plazoAnios,
      actualizarAportePorInflacion: escenario.actualizarAportePorInflacion,
    })
  }

  // Mostrar detalle completo del escenario
  const mostrarDetalle = (escenario: Escenario) => {
    setEscenarioDetalle(escenario)
    setIsDetalleOpen(true)
  }

  // Guardar escenario
  const guardarEscenario = () => {
    if (!escenarioActual) return

    if (isEditando && escenarioActual.id) {
      editarEscenario(escenarioActual.id, escenarioActual)
    } else if (!isEditando) {
      agregarEscenario(escenarioActual as Omit<Escenario, "id" | "color" | "resultado" | "crecimientoPorAnio">)
    }

    setIsDialogOpen(false)
    setEscenarioActual(null)
    setActiveTab("comparacion")
  }

  // Encontrar el valor máximo para el gráfico
  const encontrarValorMaximo = () => {
    if (escenarios.length === 0) return 0
    return Math.max(...escenarios.map((e) => (e.crecimientoPorAnio ? Math.max(...e.crecimientoPorAnio) : 0)))
  }

  // Preparar datos para los gráficos
  const prepararDatosGrafico = () => {
    if (escenarios.length === 0) return []
    
    // Encontrar el rango de edades
    const edadMinima = Math.min(...escenarios.map((e) => e.edadActual))
    const edadMaxima = Math.max(...escenarios.map((e) => e.edadRetiro))
    const datos = []
    
    for (let edad = edadMinima; edad <= edadMaxima; edad++) {
      const punto: any = { edad }
      
              escenarios.forEach((escenario) => {
          const añoIndice = edad - escenario.edadActual
          if (añoIndice >= 0 && 
              escenario.crecimientoPorAnio && 
              añoIndice < escenario.crecimientoPorAnio.length && 
              escenario.crecimientoPorAnio[añoIndice] !== undefined) {
            punto[escenario.nombre] = escenario.crecimientoPorAnio[añoIndice]
          }
        })
      
      datos.push(punto)
    }
    
    return datos
  }

  // Obtener colores para los gráficos
  const obtenerColoresGrafico = () => {
    const colores = {
      'bg-blue-500': '#3b82f6',
      'bg-emerald-500': '#10b981',
      'bg-amber-500': '#f59e0b',
      'bg-rose-500': '#f43f5e',
      'bg-violet-500': '#8b5cf6',
      'bg-cyan-500': '#06b6d4',
      'bg-fuchsia-500': '#d946ef',
      'bg-lime-500': '#84cc16',
    }
    
    return escenarios.map(escenario => ({
      nombre: escenario.nombre,
      color: colores[escenario.color as keyof typeof colores] || '#3b82f6'
    }))
  }

  // Formatear valores en el tooltip
  const formatearTooltip = (value: number, name: string) => {
    return [`$${formatearNumero(value)}`, name]
  }

  // Renderizar el gráfico según el tipo seleccionado
  const renderizarGrafico = () => {
    if (escenarios.length === 0) return null

    const datos = prepararDatosGrafico()
    const colores = obtenerColoresGrafico()

    if (tipoGrafico === 'lineas') {
      return (
        <ResponsiveContainer width="100%" height={450}>
          <LineChart data={datos} margin={{ top: 20, right: 30, left: 80, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="edad" 
              label={{ value: 'Edad (años)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tickFormatter={(value) => `$${formatearNumero(value)}`}
              label={{ value: 'Monto Acumulado', angle: -90, position: 'insideLeft' }}
              width={70}
            />
            <Tooltip formatter={formatearTooltip} />
            <Legend />
            {escenarios.map((escenario, index) => (
              <Line
                key={escenario.id}
                type="monotone"
                dataKey={escenario.nombre}
                stroke={colores[index]?.color || '#3b82f6'}
                strokeWidth={3}
                dot={{ fill: colores[index]?.color || '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    } else {
      // Preparar datos para gráfico de barras (solo monto final)
      const datosBarras = escenarios.map(escenario => ({
        nombre: escenario.nombre,
        montoFinal: escenario.resultado || 0,
        color: colores.find(c => c.nombre === escenario.nombre)?.color || '#3b82f6'
      }))

      return (
        <ResponsiveContainer width="100%" height={450}>
          <BarChart data={datosBarras} margin={{ top: 20, right: 30, left: 80, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="nombre" 
              label={{ value: 'Escenarios', position: 'insideBottom', offset: -5 }}
              angle={-15}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tickFormatter={(value) => `$${formatearNumero(value)}`}
              label={{ value: 'Monto Final', angle: -90, position: 'insideLeft' }}
              width={70}
            />
            <Tooltip formatter={formatearTooltip} />
            <RechartsBar dataKey="montoFinal">
              {datosBarras.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </RechartsBar>
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="flex items-center mb-4">
              <PiggyBank className="h-10 w-10 text-primary mr-2" />
              <h1 className="text-3xl font-bold text-slate-900">
                <span className="font-black">MiRetiro</span>
              </h1>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Comparador de Planes de Retiro</h1>
            <p className="text-slate-600">
              Crea y compara diferentes escenarios de tu plan de retiro para tomar la mejor decisión.
            </p>
          </div>
          <Link href="/calculadora">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a calculadora
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {escenarios.length >= 2 ? (
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="escenarios">Mis Escenarios</TabsTrigger>
              <TabsTrigger value="comparacion">Comparación</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-1 mb-8">
              <TabsTrigger value="escenarios">Mis Escenarios</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="escenarios" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Escenarios de Plan de Retiro</h2>
              <p className="text-slate-500 text-sm mt-1">
                Crea y gestiona diferentes escenarios para tu plan de retiro
              </p>
            </div>

            {escenarios.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-500 mb-4">No has creado ningún escenario todavía.</p>
                  <Button onClick={crearEscenario}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear mi primer escenario
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {escenarios.map((escenario) => (
                  <Card key={escenario.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${escenario.color}`}></div>
                          <CardTitle className="text-lg">{escenario.nombre}</CardTitle>
                        </div>
                        <EscenarioOptions
                          escenario={escenario}
                          onEdit={() => editarEscenarioExistente(escenario)}
                          onDuplicate={() => duplicarEscenario(escenario)}
                          onDelete={() => eliminarEscenario(escenario.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                        <div className="flex items-center text-slate-500">
                          <DollarSign className="mr-1 h-4 w-4" />
                          Capital inicial:
                        </div>
                        <div className="text-right font-medium">${formatearNumero(escenario.montoInicial)}</div>

                        <div className="flex items-center text-slate-500">
                          <DollarSign className="mr-1 h-4 w-4" />
                          Aporte mensual:
                        </div>
                        <div className="text-right font-medium">${formatearNumero(escenario.aportacionMensual)}</div>

                        <div className="flex items-center text-slate-500">
                          <TrendingUp className="mr-1 h-4 w-4" />
                          Rendimiento:
                        </div>
                        <div className="text-right font-medium">{escenario.tasaInteres}%</div>

                        <div className="flex items-center text-slate-500">
                          <Percent className="mr-1 h-4 w-4" />
                          Inflación:
                        </div>
                        <div className="text-right font-medium">{escenario.inflacion}%</div>
                        
                        <div className="flex items-center text-slate-500">
                          <Calendar className="mr-1 h-4 w-4" />
                          Edad retiro:
                        </div>
                        <div className="text-right font-medium">{escenario.edadRetiro} años</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="text-center">
                          <div className="text-sm text-slate-500 mb-1">Monto final estimado</div>
                          <div className="text-2xl font-bold">${formatearNumero(escenario.resultado || 0)}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className={escenarios.length >= 2 ? "flex-1" : "w-full"}
                          onClick={() => mostrarDetalle(escenario)}
                        >
                          Ver detalle
                        </Button>
                        {escenarios.length >= 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 justify-between"
                            onClick={() => setActiveTab("comparacion")}
                          >
                            <span>Comparar</span>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/graficos?escenario=${escenario.id}`)}
                        >
                          <BarChartIcon className="mr-1 h-4 w-4" />
                          Ver gráficos
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/pdf?escenario=${escenario.id}`)}
                        >
                          <Download className="mr-1 h-4 w-4" />
                          Generar PDF
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}

                <Card className="border-dashed flex items-center justify-center h-full">
                  <CardContent className="text-center">
                    <Button variant="outline" onClick={crearEscenario} className="h-auto py-8 px-6 flex flex-col gap-2">
                      <PlusCircle className="h-8 w-8 text-primary" />
                      <span>Añadir nuevo escenario</span>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparacion" className="space-y-8">
            <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold">Comparación de Escenarios</h2>
                <p className="text-slate-500 text-sm">
                  Visualiza y compara el rendimiento de tus diferentes escenarios
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={tipoGrafico === 'barras' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoGrafico('barras')}
                >
                  <BarChartIcon className="mr-2 h-4 w-4" />
                  Gráfico de barras
                </Button>
                <Button 
                  variant={tipoGrafico === 'lineas' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoGrafico('lineas')}
                >
                  <LineChartIcon className="mr-2 h-4 w-4" />
                  Gráfico de líneas
                </Button>
              </div>
            </div>

            {escenarios.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <p className="text-slate-500 mb-4">No hay escenarios para comparar.</p>
                  <Button onClick={crearEscenario}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Crear mi primer escenario
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Crecimiento a lo largo del tiempo</CardTitle>
                    <CardDescription>Evolución del capital para cada escenario año tras año</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full overflow-auto">{renderizarGrafico()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tabla comparativa</CardTitle>
                    <CardDescription>Comparación detallada de todos los escenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Escenario</TableHead>
                            <TableHead className="text-right">Cap. Inicial</TableHead>
                            <TableHead className="text-right">Aporte mensual</TableHead>
                            <TableHead className="text-right">Total Invertido</TableHead>
                            <TableHead className="text-right">Rendimiento</TableHead>
                            <TableHead className="text-right">Inflación</TableHead>
                            <TableHead className="text-right">Monto final</TableHead>
                            <TableHead className="text-right">Ganancia Neta</TableHead>
                            <TableHead className="text-right">% Retorno</TableHead>
                            <TableHead className="text-right">Años</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {escenarios.map((escenario) => {
                            const inversionTotal =
                              escenario.montoInicial + escenario.aportacionMensual * 12 * escenario.plazoAnios
                            const gananciaNeta = (escenario.resultado || 0) - inversionTotal
                            const rendimiento = (gananciaNeta / inversionTotal) * 100

                            return (
                              <TableRow 
                                key={`table-${escenario.id}`}
                                className="cursor-pointer hover:bg-slate-50"
                                onClick={() => mostrarDetalle(escenario)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${escenario.color}`}></div>
                                    <span className="font-medium">{escenario.nombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">${formatearNumero(escenario.montoInicial)}</TableCell>
                                <TableCell className="text-right">
                                  ${formatearNumero(escenario.aportacionMensual)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-blue-600">
                                  ${formatearNumero(inversionTotal)}
                                </TableCell>
                                <TableCell className="text-right">{escenario.tasaInteres}%</TableCell>
                                <TableCell className="text-right">{escenario.inflacion}%</TableCell>
                                <TableCell className="text-right font-bold text-green-600">
                                  ${formatearNumero(escenario.resultado || 0)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-emerald-600">
                                  ${formatearNumero(gananciaNeta)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className={`rounded-full px-2 py-1 text-xs font-medium inline-block ${
                                    rendimiento > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                  }`}>
                                    {rendimiento > 0 ? '+' : ''}{rendimiento.toFixed(1)}%
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-slate-600">
                                  {escenario.plazoAnios} años
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumen estadístico - Solo mostrar si hay 3 o más escenarios */}
                {escenarios.length >= 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resumen Estadístico</CardTitle>
                      <CardDescription>Comparación destacada entre todos los escenarios</CardDescription>
                    </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        const mejorEscenario = escenarios.reduce((prev, current) => 
                          (current.resultado || 0) > (prev.resultado || 0) ? current : prev
                        )
                        const peorEscenario = escenarios.reduce((prev, current) => 
                          (current.resultado || 0) < (prev.resultado || 0) ? current : prev
                        )
                        const promedioMonto = escenarios.reduce((sum, e) => sum + (e.resultado || 0), 0) / escenarios.length
                        
                        return (
                          <>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <h4 className="font-semibold text-green-800 mb-2">🏆 Mejor Escenario</h4>
                              <div className="space-y-1">
                                <p className="font-medium text-green-700">{mejorEscenario.nombre}</p>
                                <p className="text-sm text-green-600">
                                  Monto final: <span className="font-bold">${formatearNumero(mejorEscenario.resultado || 0)}</span>
                                </p>
                                <p className="text-xs text-green-500">
                                  Rendimiento: {mejorEscenario.tasaInteres}% | Inflación: {mejorEscenario.inflacion}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                              <h4 className="font-semibold text-slate-800 mb-2">📊 Promedio</h4>
                              <div className="space-y-1">
                                <p className="text-sm text-slate-600">
                                  Monto promedio: <span className="font-bold">${formatearNumero(promedioMonto)}</span>
                                </p>
                                <p className="text-xs text-slate-500">
                                  Basado en {escenarios.length} escenario{escenarios.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                              <h4 className="font-semibold text-amber-800 mb-2">⚠️ Menor Rendimiento</h4>
                              <div className="space-y-1">
                                <p className="font-medium text-amber-700">{peorEscenario.nombre}</p>
                                <p className="text-sm text-amber-600">
                                  Monto final: <span className="font-bold">${formatearNumero(peorEscenario.resultado || 0)}</span>
                                </p>
                                <p className="text-xs text-amber-500">
                                  Diferencia: -${formatearNumero((mejorEscenario.resultado || 0) - (peorEscenario.resultado || 0))}
                                </p>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
                )}

                <div className="flex justify-center">
                  <Button onClick={crearEscenario}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir otro escenario
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Diálogo para crear/editar escenario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditando ? "Editar escenario" : "Crear nuevo escenario"}</DialogTitle>
            <DialogDescription>Define los parámetros para este escenario de inversión.</DialogDescription>
          </DialogHeader>

          {escenarioActual && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del escenario</Label>
                <Input
                  id="nombre"
                  value={escenarioActual.nombre}
                  onChange={(e) =>
                    setEscenarioActual({
                      ...escenarioActual,
                      nombre: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edadActual">Edad actual</Label>
                  <Input
                    id="edadActual"
                    type="number"
                    value={escenarioActual.edadActual}
                    disabled
                    className="bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">La edad actual se calcula desde tu fecha de nacimiento</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edadRetiro">Edad de retiro</Label>
                  <Input
                    id="edadRetiro"
                    type="number"
                    value={escenarioActual.edadRetiro}
                    onChange={(e) =>
                      setEscenarioActual({
                        ...escenarioActual,
                        edadRetiro: Number(e.target.value),
                        plazoAnios: Number(e.target.value) - (escenarioActual.edadActual || 0),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costoVidaMensual">Costo de vida mensual ($)</Label>
                <Input
                  id="costoVidaMensual"
                  type="number"
                  value={escenarioActual.costoVidaMensual}
                  onChange={(e) =>
                    setEscenarioActual({
                      ...escenarioActual,
                      costoVidaMensual: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montoInicial">Capital inicial ($)</Label>
                <Input
                  id="montoInicial"
                  type="number"
                  value={escenarioActual.montoInicial}
                  onChange={(e) =>
                    setEscenarioActual({
                      ...escenarioActual,
                      montoInicial: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="aportacionMensual">Aporte mensual ($)</Label>
                <Input
                  id="aportacionMensual"
                  type="number"
                  value={escenarioActual.aportacionMensual}
                  onChange={(e) =>
                    setEscenarioActual({
                      ...escenarioActual,
                      aportacionMensual: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tasaInteres">Rendimiento anual (%)</Label>
                  <Select
                    value={escenarioActual.tasaInteres?.toString()}
                    onValueChange={(value) =>
                      setEscenarioActual({
                        ...escenarioActual,
                        tasaInteres: parseFloat(value),
                      })
                    }
                  >
                    <SelectTrigger id="tasaInteres">
                      <SelectValue placeholder="Seleccionar rendimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Conservador (3%)</SelectItem>
                      <SelectItem value="6">Moderado (6%)</SelectItem>
                      <SelectItem value="9">Agresivo (9%)</SelectItem>
                      <SelectItem value="12">Muy agresivo (12%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inflacion">Inflación anual (%)</Label>
                  <Select
                    value={escenarioActual.inflacion?.toString()}
                    onValueChange={(value) =>
                      setEscenarioActual({
                        ...escenarioActual,
                        inflacion: parseFloat(value),
                      })
                    }
                  >
                    <SelectTrigger id="inflacion">
                      <SelectValue placeholder="Seleccionar inflación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Baja (2%)</SelectItem>
                      <SelectItem value="3.5">Moderada (3.5%)</SelectItem>
                      <SelectItem value="5">Alta (5%)</SelectItem>
                      <SelectItem value="7">Muy alta (7%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="actualizarAporte"
                  checked={escenarioActual.actualizarAportePorInflacion}
                  onChange={(e) =>
                    setEscenarioActual({
                      ...escenarioActual,
                      actualizarAportePorInflacion: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="actualizarAporte" className="text-sm">
                  Actualizar aporte mensual por inflación cada año
                </Label>
              </div>

              <input
                type="hidden"
                value={escenarioActual.plazoAnios = (escenarioActual.edadRetiro || 65) - (escenarioActual.edadActual || 30)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarEscenario}>{isEditando ? "Guardar cambios" : "Crear escenario"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle completo del escenario */}
      <Dialog open={isDetalleOpen} onOpenChange={setIsDetalleOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {escenarioDetalle && (
                <>
                  <div className={`w-4 h-4 rounded-full ${escenarioDetalle.color}`}></div>
                  {escenarioDetalle.nombre} - Análisis Completo
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Detalles completos de la proyección financiera y resultados del escenario
            </DialogDescription>
          </DialogHeader>

          {escenarioDetalle && (
            <div className="space-y-6">
              {/* Resumen Principal */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Resumen de Inversión</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Monto Final Proyectado</p>
                    <p className="text-2xl font-bold text-blue-800">${formatearNumero(escenarioDetalle.resultado || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Total Invertido</p>
                    <p className="text-xl font-semibold text-blue-700">
                      ${formatearNumero(escenarioDetalle.montoInicial + escenarioDetalle.aportacionMensual * 12 * escenarioDetalle.plazoAnios)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-blue-600">Ganancia Neta</p>
                    <p className="text-xl font-semibold text-green-600">
                      ${formatearNumero((escenarioDetalle.resultado || 0) - (escenarioDetalle.montoInicial + escenarioDetalle.aportacionMensual * 12 * escenarioDetalle.plazoAnios))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parámetros del Escenario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Datos Personales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Edad Actual:</span>
                      <span className="font-medium">{escenarioDetalle.edadActual} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Edad de Retiro:</span>
                      <span className="font-medium">{escenarioDetalle.edadRetiro} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Años hasta el Retiro:</span>
                      <span className="font-medium">{escenarioDetalle.plazoAnios} años</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Costo de Vida Mensual:</span>
                      <span className="font-medium">${formatearNumero(escenarioDetalle.costoVidaMensual)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Parámetros de Inversión</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Capital Inicial:</span>
                      <span className="font-medium">${formatearNumero(escenarioDetalle.montoInicial)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Aporte Mensual:</span>
                      <span className="font-medium">${formatearNumero(escenarioDetalle.aportacionMensual)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Rendimiento Anual:</span>
                      <span className="font-medium">{escenarioDetalle.tasaInteres}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inflación Anual:</span>
                      <span className="font-medium">{escenarioDetalle.inflacion}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análisis de Rendimiento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Análisis de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {(() => {
                      const totalInvertido = escenarioDetalle.montoInicial + escenarioDetalle.aportacionMensual * 12 * escenarioDetalle.plazoAnios
                      const gananciaNeta = (escenarioDetalle.resultado || 0) - totalInvertido
                      const retornoTotal = (gananciaNeta / totalInvertido) * 100
                      const retornoAnual = retornoTotal / escenarioDetalle.plazoAnios
                      const costoVidaActualizado = escenarioDetalle.costoVidaMensual * Math.pow(1 + escenarioDetalle.inflacion / 100, escenarioDetalle.plazoAnios)
                      
                      return (
                        <>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <p className="text-xs text-green-600">Retorno Total</p>
                            <p className="text-lg font-bold text-green-700">{retornoTotal.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-600">Retorno Anual Promedio</p>
                            <p className="text-lg font-bold text-blue-700">{retornoAnual.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-xs text-purple-600">Multiplicador</p>
                            <p className="text-lg font-bold text-purple-700">{((escenarioDetalle.resultado || 0) / totalInvertido).toFixed(1)}x</p>
                          </div>
                          <div className="text-center p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs text-amber-600">Costo Vida Final</p>
                            <p className="text-lg font-bold text-amber-700">${formatearNumero(costoVidaActualizado)}</p>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Proyección año por año - Primeros 5 años y últimos 5 años */}
              {escenarioDetalle.crecimientoPorAnio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Proyección por Años</CardTitle>
                    <CardDescription>Primeros 5 años y últimos 5 años (los más relevantes)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Edad</th>
                            <th className="text-right py-2">Saldo Acumulado</th>
                            <th className="text-right py-2">Aportes del Año</th>
                            <th className="text-right py-2">Rendimiento del Año</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Primeros 5 años */}
                          {escenarioDetalle.crecimientoPorAnio.slice(0, 6).map((monto, index) => {
                            const edad = escenarioDetalle.edadActual + index
                            const aporteAnual = index === 0 ? escenarioDetalle.montoInicial : escenarioDetalle.aportacionMensual * 12
                            const saldoAnterior = index === 0 ? 0 : escenarioDetalle.crecimientoPorAnio![index - 1]
                            const rendimientoAño = index === 0 ? 0 : monto - saldoAnterior - aporteAnual
                            
                            return (
                              <tr key={index} className={index % 2 === 0 ? "bg-slate-50" : ""}>
                                <td className="py-2 font-medium">{edad} años</td>
                                <td className="text-right py-2 font-medium">${formatearNumero(monto)}</td>
                                <td className="text-right py-2 text-blue-600">${formatearNumero(aporteAnual)}</td>
                                <td className="text-right py-2 text-green-600">{formatearNumero(rendimientoAño)}</td>
                              </tr>
                            )
                          })}
                          
                          {/* Separador si hay años en el medio */}
                          {escenarioDetalle.crecimientoPorAnio.length > 12 && (
                            <tr>
                              <td colSpan={4} className="text-center py-3 text-slate-400 italic">
                                ... {escenarioDetalle.crecimientoPorAnio.length - 12} años intermedios ...
                              </td>
                            </tr>
                          )}
                          
                          {/* Últimos 5 años */}
                          {escenarioDetalle.crecimientoPorAnio.length > 6 && 
                            escenarioDetalle.crecimientoPorAnio.slice(-6).map((monto, index) => {
                              const totalLength = escenarioDetalle.crecimientoPorAnio!.length
                              const realIndex = totalLength - 6 + index
                              const edad = escenarioDetalle.edadActual + realIndex
                              const aporteAnual = realIndex === 0 ? escenarioDetalle.montoInicial : escenarioDetalle.aportacionMensual * 12
                              const saldoAnterior = realIndex === 0 ? 0 : escenarioDetalle.crecimientoPorAnio![realIndex - 1]
                              const rendimientoAño = realIndex === 0 ? 0 : monto - saldoAnterior - aporteAnual
                              
                              return (
                                <tr key={`last-${index}`} className={index % 2 === 0 ? "bg-amber-50" : "bg-amber-25"}>
                                  <td className="py-2 font-medium text-amber-800">{edad} años</td>
                                  <td className="text-right py-2 font-bold text-amber-900">${formatearNumero(monto)}</td>
                                  <td className="text-right py-2 text-blue-600">${formatearNumero(aporteAnual)}</td>
                                  <td className="text-right py-2 text-green-600 font-medium">{formatearNumero(rendimientoAño)}</td>
                                </tr>
                              )
                            })
                          }
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 bg-amber-50 p-2 rounded">
                      <p className="font-medium">💡 Los últimos años (destacados) muestran el poder del interés compuesto</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 