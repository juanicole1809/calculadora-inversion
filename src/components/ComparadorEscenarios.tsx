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
  BarChart,
  LineChart,
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
} from "lucide-react"
import { useEscenarios, type Escenario } from "@/context/escenarios-context"
import Link from "next/link"

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
  const [escenarioActual, setEscenarioActual] = useState<Partial<Escenario> | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditando, setIsEditando] = useState(false)
  const [activeTab, setActiveTab] = useState("escenarios")

  // Formatear números para mostrar
  const formatearNumero = (numero: number) => {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
      notation: numero > 1000000 ? "compact" : "standard",
      compactDisplay: "short",
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
    })
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

  // Renderizar el gráfico de líneas
  const renderizarGrafico = () => {
    if (escenarios.length === 0) return null

    const maxValor = encontrarValorMaximo()
    const maxAnios = Math.max(...escenarios.map((e) => e.plazoAnios))
    const alturaGrafico = 300
    const anchoGrafico = 800
    const padding = { top: 20, right: 20, bottom: 40, left: 60 }
    const anchoUtil = anchoGrafico - padding.left - padding.right
    const alturaUtil = alturaGrafico - padding.top - padding.bottom

    // Crear escala para el eje X (años)
    const escalaX = (anio: number) => padding.left + (anio / maxAnios) * anchoUtil

    // Crear escala para el eje Y (montos)
    const escalaY = (valor: number) => alturaGrafico - padding.bottom - (valor / maxValor) * alturaUtil

    return (
      <div className="relative mt-6 overflow-x-auto">
        <svg width={anchoGrafico} height={alturaGrafico} className="mx-auto">
          {/* Eje Y */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={alturaGrafico - padding.bottom}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Eje X */}
          <line
            x1={padding.left}
            y1={alturaGrafico - padding.bottom}
            x2={anchoGrafico - padding.right}
            y2={alturaGrafico - padding.bottom}
            stroke="#e2e8f0"
            strokeWidth="1"
          />

          {/* Líneas de cuadrícula horizontales */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = escalaY(maxValor * ratio)
            return (
              <g key={`grid-h-${i}`}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={anchoGrafico - padding.right}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#64748b">
                  ${formatearNumero(maxValor * ratio)}
                </text>
              </g>
            )
          })}

          {/* Etiquetas del eje X */}
          {Array.from({ length: maxAnios + 1 }).map((_, i) => {
            if (i % Math.ceil(maxAnios / 10) === 0 || i === maxAnios) {
              return (
                <text
                  key={`label-x-${i}`}
                  x={escalaX(i)}
                  y={alturaGrafico - padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#64748b"
                >
                  {i}
                </text>
              )
            }
            return null
          })}

          {/* Líneas para cada escenario */}
          {escenarios.map((escenario) => {
            if (!escenario.crecimientoPorAnio) return null

            const puntos = escenario.crecimientoPorAnio
              .map((valor, anio) => `${escalaX(anio)},${escalaY(valor)}`)
              .join(" ")

            const colorLinea = escenario.color.replace("bg-", "stroke-")

            return (
              <g key={escenario.id}>
                <polyline
                  points={puntos}
                  fill="none"
                  className={colorLinea}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Puntos en cada año */}
                {escenario.crecimientoPorAnio.map((valor, anio) => (
                  <circle
                    key={`${escenario.id}-${anio}`}
                    cx={escalaX(anio)}
                    cy={escalaY(valor)}
                    r="4"
                    className={escenario.color.replace("bg-", "fill-")}
                    stroke="white"
                    strokeWidth="1"
                  />
                ))}
              </g>
            )
          })}
        </svg>

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          {escenarios.map((escenario) => (
            <div key={`legend-${escenario.id}`} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${escenario.color}`}></div>
              <span className="text-sm">{escenario.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    )
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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="escenarios">Mis Escenarios</TabsTrigger>
            <TabsTrigger value="comparacion">Comparación</TabsTrigger>
          </TabsList>

          <TabsContent value="escenarios" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Escenarios de Plan de Retiro</h2>
              <Button onClick={crearEscenario}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Escenario
              </Button>
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
                    <CardFooter className="pt-0">
                      <Button
                        variant="ghost"
                        className="w-full justify-between"
                        onClick={() => setActiveTab("comparacion")}
                      >
                        <span>Ver en comparación</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
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
                <Button variant="outline" size="sm">
                  <BarChart className="mr-2 h-4 w-4" />
                  Gráfico de barras
                </Button>
                <Button size="sm" variant="default">
                  <LineChart className="mr-2 h-4 w-4" />
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
                            <TableHead className="text-right">Rendimiento</TableHead>
                            <TableHead className="text-right">Inflación</TableHead>
                            <TableHead className="text-right">Monto final</TableHead>
                            <TableHead className="text-right">% Retorno</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {escenarios.map((escenario) => {
                            const inversionTotal =
                              escenario.montoInicial + escenario.aportacionMensual * 12 * escenario.plazoAnios
                            const rendimiento = (((escenario.resultado || 0) - inversionTotal) / inversionTotal) * 100

                            return (
                              <TableRow key={`table-${escenario.id}`}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${escenario.color}`}></div>
                                    <span>{escenario.nombre}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">${formatearNumero(escenario.montoInicial)}</TableCell>
                                <TableCell className="text-right">
                                  ${formatearNumero(escenario.aportacionMensual)}
                                </TableCell>
                                <TableCell className="text-right">{escenario.tasaInteres}%</TableCell>
                                <TableCell className="text-right">{escenario.inflacion}%</TableCell>
                                <TableCell className="text-right font-medium">
                                  ${formatearNumero(escenario.resultado || 0)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="bg-green-50 text-green-700 rounded-full px-2 py-1 text-xs font-medium inline-block">
                                    +{rendimiento.toFixed(1)}%
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

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
                    onChange={(e) =>
                      setEscenarioActual({
                        ...escenarioActual,
                        edadActual: Number(e.target.value),
                      })
                    }
                  />
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
    </div>
  )
} 