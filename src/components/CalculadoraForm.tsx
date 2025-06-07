'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { InfoIcon, XIcon, RefreshCw, ArrowRight, ArrowLeft, Calculator, FileText, Printer, PiggyBank, BarChart2, Save } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from '../lib/utils'
import { exportToPDF } from '../lib/pdfUtils'
import { createSimplePDF } from '../lib/simplePdf'
import FormularioCalculadora from './FormularioCalculadora'
import { GraficosProyeccion } from "./GraficosProyeccion"
import { toast } from 'sonner'
import { useEscenarios } from "@/context/escenarios-context";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ResultadosInversion {
  capital_inicial: number
  inversion_mensual: number
  total_aportes_mensuales: number
  total_invertido: number
  monto_total: number
  ganancia_neta: number
  anios_retiro: number | string
  mensaje_retiro: string
  costo_vida_inicial: number
  costo_vida_actualizado: number
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

interface FormData {
  // Datos personales
  edad_actual: number
  fecha_nacimiento: Date
  edad_retiro: number
  costo_vida_mensual: number
  // Datos de inversión
  capital_inicial: number
  inversion_mensual: number
  rendimiento_anual: number | string
  inflacion_anual: number | string
  actualizar_aporte_por_inflacion?: boolean
}

export default function CalculadoraForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [resultados, setResultados] = useState<ResultadosInversion | null>(null)
  const [formData, setFormData] = useState<FormData>({
    edad_actual: 0,
    fecha_nacimiento: new Date(''), // Fecha inválida que se mostrará como vacía
    edad_retiro: 65,
    costo_vida_mensual: 0,
    capital_inicial: 0,
    inversion_mensual: 0,
    rendimiento_anual: 6, // Valor por defecto actualizado a 6%
    inflacion_anual: 3.5,
    actualizar_aporte_por_inflacion: true
  })
  // Estado para el texto del campo de fecha
  const [textoFecha, setTextoFecha] = useState('')
  const [formStep, setFormStep] = useState(0) // 0 = datos personales, 1 = datos de inversión
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeInfoBox, setActiveInfoBox] = useState<string | null>(null)
  const [inflacionPersonalizada, setInflacionPersonalizada] = useState(false)
  const [rendimientoPersonalizado, setRendimientoPersonalizado] = useState(false)
  const [detallesAbiertos, setDetallesAbiertos] = useState(false)
  const [proyeccionAbierta, setProyeccionAbierta] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  // Almacenar valores numéricos para usar en la UI
  const [uiValues, setUiValues] = useState({
    rendimientoAnual: 6,
    inflacionAnual: 3.5
  })
  
  // Referencia para el componente de resultados para exportar a PDF
  const resultadosRef = useRef<HTMLDivElement>(null)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  
  const router = useRouter();
  const { agregarEscenario, escenarios } = useEscenarios();
  
  // Cargar el nombre del usuario desde localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) {
      setUserName(savedName);
    }
    
    // Sincronizar textoFecha con fecha_nacimiento si existe
    if (formData.fecha_nacimiento instanceof Date && 
        !isNaN(formData.fecha_nacimiento.getTime()) && 
        formData.fecha_nacimiento.getFullYear() > 1900) {
      setTextoFecha(format(formData.fecha_nacimiento, "dd/MM/yyyy"));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : parseFloat(value) || 0
    }))
    
    // Limpiar error de validación cuando el usuario modifica el campo
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date && date instanceof Date && !isNaN(date.getTime())) {
      // Calcular la edad actual basada en la fecha de nacimiento
      const hoy = new Date();
      let edadCalculada = hoy.getFullYear() - date.getFullYear();
      const mesActual = hoy.getMonth();
      const diaActual = hoy.getDate();
      const mesNacimiento = date.getMonth();
      const diaNacimiento = date.getDate();
      
      // Ajustar la edad si aún no ha cumplido años en el año actual
      if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
        edadCalculada--;
      }
      
      // Asegurarse de que la edad sea válida
      edadCalculada = Math.max(0, edadCalculada);
      
      setFormData(prev => ({
        ...prev,
        fecha_nacimiento: date,
        edad_actual: edadCalculada
      }));
      
      // Sincronizar el texto de la fecha con el formato adecuado
      setTextoFecha(format(date, "dd/MM/yyyy"));
      
      // Limpiar error de validación si existiera
      if (validationErrors.fecha_nacimiento) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.fecha_nacimiento;
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validar todos los campos antes de enviar
    const errors = validateAllFields()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Si hay errores en la pestaña de datos personales, cambiar a esa pestaña
      if (errors.fecha_nacimiento || errors.edad_retiro || errors.costo_vida_mensual) {
        setFormStep(0)
      }
      return
    }
    
    // Limpiar cualquier error de validación restante
    setValidationErrors({})
    
    setIsLoading(true)

    // Calcular total_anios basado en edad_actual y edad_retiro
    const total_anios = formData.edad_retiro - formData.edad_actual

    const data = {
      capital_inicial: formData.capital_inicial,
      inversion_mensual: formData.inversion_mensual,
      tasa_anual: typeof formData.rendimiento_anual === 'string' ? 
        parseFloat(formData.rendimiento_anual) || 0 : formData.rendimiento_anual,
      inflacion_anual: typeof formData.inflacion_anual === 'string' ? 
        parseFloat(formData.inflacion_anual) || 0 : formData.inflacion_anual,
      total_anios: total_anios,
      costo_vida_mensual: formData.costo_vida_mensual,
      actualizar_aporte_por_inflacion: formData.actualizar_aporte_por_inflacion || false
    }

    try {
      const response = await fetch('/api/calcular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Error en el cálculo')
      const result = await response.json()
      
      console.log('Datos recibidos:', result);
      console.log('Proyección anual:', result.proyeccionAnual);
      
      // Guardar los valores numéricos para usar en la UI
      setUiValues({
        rendimientoAnual: typeof formData.rendimiento_anual === 'string' ? parseFloat(formData.rendimiento_anual) || 0 : formData.rendimiento_anual,
        inflacionAnual: typeof formData.inflacion_anual === 'string' ? parseFloat(formData.inflacion_anual) || 0 : formData.inflacion_anual
      });
      
      // Dejamos el mensaje tal como viene de la API
      // La API ya maneja los casos especiales como rendimiento 0%
      
      setResultados(result)
      
      // Desplazamiento automático hacia los resultados
      setTimeout(() => {
        const resultadosElement = document.getElementById('resumen-inversion');
        if (resultadosElement) {
          resultadosElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al realizar el cálculo', {
        description: 'Por favor, intenta nuevamente',
        duration: 4000,
        closeButton: true
      });
    } finally {
      setIsLoading(false)
    }
  }

  const validateAllFields = () => {
    const errors: Record<string, string> = {}
    
    // Validar datos personales
    // Solo mostramos error de fecha de nacimiento si está vacía o si tiene un formato incorrecto pero ya no está siendo editada
    if (!formData.fecha_nacimiento || 
        (!(formData.fecha_nacimiento instanceof Date) || isNaN(formData.fecha_nacimiento.getTime())) && document.activeElement?.id !== 'fecha_nacimiento') {
      errors.fecha_nacimiento = "La fecha de nacimiento es requerida y debe ser válida"
    }
    if (!formData.edad_retiro && formData.edad_retiro !== 0) errors.edad_retiro = "La edad de retiro es requerida"
    if (formData.edad_retiro <= formData.edad_actual) errors.edad_retiro = "La edad de retiro debe ser mayor a la edad actual"
    if (!formData.costo_vida_mensual && formData.costo_vida_mensual !== 0) errors.costo_vida_mensual = "El costo de vida mensual es requerido"
    
    // Validar datos de inversión
    if ((!formData.capital_inicial || formData.capital_inicial === 0) && 
        (!formData.inversion_mensual || formData.inversion_mensual === 0)) {
      errors.capital_inicial = "Debes ingresar al menos un capital inicial o un aporte mensual"
    }
    
    // Solo validar rendimiento si está vacío o es igual a ''
    if (formData.rendimiento_anual === '' || formData.rendimiento_anual === undefined) {
      errors.rendimiento_anual = "El rendimiento de la inversión es requerido"
    }
    
    return errors
  }
  
  const validatePersonalData = () => {
    const errors: Record<string, string> = {}
    
    // Solo mostramos error de fecha de nacimiento si está vacía o si tiene un formato incorrecto pero ya no está siendo editada
    if (!formData.fecha_nacimiento || 
        (!(formData.fecha_nacimiento instanceof Date) || isNaN(formData.fecha_nacimiento.getTime())) && document.activeElement?.id !== 'fecha_nacimiento') {
      errors.fecha_nacimiento = "La fecha de nacimiento es requerida y debe ser válida"
    }
    if (!formData.edad_retiro && formData.edad_retiro !== 0) errors.edad_retiro = "La edad de retiro es requerida"
    if (formData.edad_retiro <= formData.edad_actual) errors.edad_retiro = "La edad de retiro debe ser mayor a la edad actual"
    if (!formData.costo_vida_mensual && formData.costo_vida_mensual !== 0) errors.costo_vida_mensual = "El costo de vida mensual es requerido"
    
    return errors
  }

  const formatCurrency = (number: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(number).replace('US$', '$ USD')
  }

  const formatYears = (years: number | string) => {
    return typeof years === 'string' ? years : 
      new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(years) + ' años'
  }

  const handleNextStep = () => {
    // Validar datos personales antes de avanzar
    const errors = validatePersonalData()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setFormStep(1)
  }

  const handlePrevStep = () => {
    setFormStep(0)
  }

  const handleReset = () => {
    setFormData(prev => ({
      ...prev,
      capital_inicial: 0,
      inversion_mensual: 0,
      rendimiento_anual: 6
      // Mantenemos los datos personales y la inflación
    }))
    setValidationErrors({})
    setResultados(null)
    setFormStep(1)
    
    toast.info('Valores de inversión reseteados', {
      description: 'Se han mantenido tus datos personales',
      duration: 3000,
      closeButton: true
    })
  }

  // Función para capitalizar la primera letra de cada palabra
  const capitalizeName = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Función para exportar los resultados a PDF
  const exportarPDF = async () => {
    if (!resultados) {
      toast.error('Error: No hay datos para exportar a PDF', {
        closeButton: true
      });
      return;
    }

    try {
      setIsExportingPDF(true);
      // Método 1: Capturar HTML (comentado)
      // const success = await exportToPDF(resultadosRef.current);
      
      // Método 2: Generar PDF desde código (preferido)
      const success = await createSimplePDF(resultados, formData, uiValues);
      
      if (success) {
        toast.success('PDF generado exitosamente', {
          description: 'El archivo se ha descargado a tu dispositivo',
          duration: 4000,
          closeButton: true
        });
      } else {
        toast.error('Error al generar el PDF', {
          description: 'Por favor, intenta nuevamente',
          duration: 4000,
          closeButton: true
        });
      }
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      toast.error('Error al generar el PDF', {
        description: 'Por favor, intenta nuevamente',
        duration: 4000,
        closeButton: true
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Calcular porcentajes para la distribución del capital
  const porcentajeInvertido = resultados ? Math.round((resultados.total_invertido / resultados.monto_total) * 100) : 0;
  const porcentajeGanancia = resultados ? Math.round((resultados.ganancia_neta / resultados.monto_total) * 100) : 0;

  // Función para guardar el escenario actual y navegar al comparador
  const guardarEscenarioYComparar = () => {
    if (!resultados) {
      toast.error('Error: Primero debes calcular los resultados', {
        closeButton: true
      });
      return;
    }

    setIsDialogOpen(true);
  };
  
  // Estado para controlar el diálogo de guardar escenario
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nombreEscenario, setNombreEscenario] = useState(`Escenario ${new Date().toLocaleDateString()}`);
  
  // Estado para la paginación de la tabla de proyección
  const [paginaActual, setPaginaActual] = useState(1);
  
  // Función para cambiar la página
  const cambiarPagina = (nuevaPagina: number, totalPaginas: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };
  
  // Función para guardar el escenario con el nombre proporcionado
  const confirmarGuardarEscenario = () => {
    try {
      // Crear escenario con los datos actuales
      agregarEscenario({
        nombre: nombreEscenario,
        montoInicial: formData.capital_inicial,
        aportacionMensual: formData.inversion_mensual,
        tasaInteres: uiValues.rendimientoAnual,
        inflacion: uiValues.inflacionAnual,
        edadActual: formData.edad_actual,
        edadRetiro: formData.edad_retiro,
        costoVidaMensual: formData.costo_vida_mensual,
        plazoAnios: formData.edad_retiro - formData.edad_actual,
        actualizarAportePorInflacion: formData.actualizar_aporte_por_inflacion !== false
      });

      toast.success('Escenario guardado correctamente', {
        closeButton: true
      });

      // Cerrar diálogo y navegar al comparador
      setIsDialogOpen(false);
      router.push('/comparador');
    } catch (error) {
      console.error('Error al guardar el escenario:', error);
      toast.error('Error al guardar el escenario', {
        closeButton: true
      });
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-center mb-4">
        <PiggyBank className="h-10 w-10 text-primary mr-2" />
        <a href="/" className="text-3xl font-bold text-slate-900 hover:text-primary transition-colors">
          <span className="font-black">MiRetiro</span>
        </a>
      </div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-stone-900 mb-4">Planificador de Inversión para Retiro</h2>
        <p className="text-lg text-stone-600 mb-8">
          Planifica tu futuro financiero calculando el potencial de tus ahorros para un retiro cómodo y seguro
        </p>
      </div>

      <div id="calculadora-form">
        <FormularioCalculadora
          formData={formData}
          textoFecha={textoFecha}
          formStep={formStep}
          validationErrors={validationErrors}
          activeInfoBox={activeInfoBox}
          inflacionPersonalizada={inflacionPersonalizada}
          rendimientoPersonalizado={rendimientoPersonalizado}
          isLoading={isLoading}
          userName={userName}
          setTextoFecha={setTextoFecha}
          setFormData={setFormData}
          setValidationErrors={setValidationErrors}
          setActiveInfoBox={setActiveInfoBox}
          setInflacionPersonalizada={setInflacionPersonalizada}
          setRendimientoPersonalizado={setRendimientoPersonalizado}
          handleDateChange={handleDateChange}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          handleNextStep={handleNextStep}
          handlePrevStep={handlePrevStep}
          capitalizeName={capitalizeName}
          setFormStep={setFormStep}
        />
      </div>

      {resultados && (
        <>
          {/* Botones de acción inmediatamente después del formulario */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6 mb-6">
            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-stone-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resetear valores
            </Button>
          </div>

          {/* Card con el resumen de la inversión */}
          <Card className="mt-6 overflow-hidden" id="resumen-inversion">
            <div className="w-full bg-blue-50 pb-4 pt-6 px-6 border-b border-blue-100">
              <h3 className="text-xl font-bold text-blue-800">
                Resumen de tu Inversión
              </h3>
              <p className="text-blue-600 mt-1">
                Proyección de capital y ganancias al momento de tu retiro
              </p>
            </div>
            <CardContent className="pt-5">
              {/* Detalles de la inversión */}
              <div className="mb-4">
                <Button 
                  type="button"
                  onClick={() => setDetallesAbiertos(!detallesAbiertos)}
                  variant="outline"
                  className="w-full mb-3 flex justify-between items-center py-2 border-stone-200 bg-stone-50"
                >
                  <span className="font-medium text-stone-800">Detalles de tu inversión</span>
                  <span className={`transition-transform duration-200 ${detallesAbiertos ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
                
                {detallesAbiertos && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div className="text-sm text-stone-500">Capital Inicial</div>
                        <div className="text-lg font-medium">{formatCurrency(resultados.capital_inicial)}</div>
                      </div>
                      
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div className="text-sm text-stone-500">Aporte Mensual</div>
                        <div className="text-lg font-medium">{formatCurrency(resultados.inversion_mensual)}</div>
                      </div>
                      
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div className="text-sm text-stone-500">Total Aportado</div>
                        <div className="text-lg font-medium">{formatCurrency(resultados.total_aportes_mensuales)}</div>
                      </div>
                      
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <div className="text-sm text-stone-500">Total Invertido</div>
                        <div className="text-lg font-medium">{formatCurrency(resultados.total_invertido)}</div>
                      </div>
                      
                      <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 sm:col-span-2">
                        <div className="text-sm text-stone-500">Costo de Vida Mensual Actual</div>
                        <div className="text-lg font-medium">{formatCurrency(resultados.costo_vida_inicial)}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Total acumulado después */}
              <div className="mb-4">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 text-center">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">TOTAL ACUMULADO AL RETIRARTE</h3>
                  <p className="text-3xl font-bold text-blue-700 mb-1">{formatCurrency(resultados.monto_total)}</p>
                  <p className="text-sm text-slate-600">
                    Este es el monto total que habrás acumulado al llegar a tu edad de retiro ({formData.edad_retiro} años)
                  </p>
                </div>
              </div>

              {/* Distribución del capital después */}
              <div>
                <h2 className="text-lg font-semibold mb-4">DISTRIBUCIÓN DE TU CAPITAL</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex w-full h-2 mb-4 overflow-hidden rounded-full">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${porcentajeInvertido}%` }}
                    />
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${porcentajeGanancia}%` }}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between text-sm">
                    <div className="flex items-center gap-2 mb-2 sm:mb-0">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>Capital invertido: {formatCurrency(resultados.total_invertido)} USD</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span>Ganancia: {formatCurrency(resultados.ganancia_neta)} USD</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de gráficos y PDF */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                {resultados && resultados.proyeccionAnual && resultados.proyeccionAnual.length > 0 && (
                  <div className="w-full sm:flex-1">
                    <GraficosProyeccion 
                      resultados={{
                        montoFinal: resultados.monto_total,
                        aportesTotales: resultados.total_invertido,
                        rendimientoTotal: resultados.ganancia_neta,
                        proyeccionAnual: resultados.proyeccionAnual
                      }} 
                    />
                  </div>
                )}
                
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 bg-emerald-25"
                  onClick={guardarEscenarioYComparar}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Escenario
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 text-red-600 border-red-600 hover:bg-red-50"
                  onClick={exportarPDF}
                  disabled={isExportingPDF}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isExportingPDF ? 'Generando PDF...' : 'Descargar PDF'}
                </Button>
              </div>
              
              {/* Enlace al comparador si hay escenarios guardados */}
              {escenarios.length > 0 && (
                <div className="mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/comparador')}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  >
                    📊 Ver mis {escenarios.length} escenario{escenarios.length > 1 ? 's' : ''} guardado{escenarios.length > 1 ? 's' : ''} →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Diálogo para ingresar nombre del escenario */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Guardar escenario</DialogTitle>
                <DialogDescription>
                  Dale un nombre a este escenario para compararlo con otros en el futuro
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label htmlFor="nombreEscenario">Nombre del escenario</Label>
                <Input 
                  id="nombreEscenario" 
                  value={nombreEscenario} 
                  onChange={(e) => setNombreEscenario(e.target.value)}
                  className="mt-2"
                  placeholder="Ej: Escenario Conservador, Plan Agresivo..."
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">¿Qué puedes hacer después?</p>
                <ul className="text-xs space-y-1">
                  <li>• Comparar este escenario con otros</li>
                  <li>• Crear variaciones cambiando variables</li>
                  <li>• Ver gráficos de proyección lado a lado</li>
                </ul>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmarGuardarEscenario}>
                  Guardar y ver comparador
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Card className="mt-6 overflow-hidden" id="resultados-section" ref={resultadosRef}>
            <div className="w-full bg-blue-50 pb-4 pt-6 px-6 border-b border-blue-100">
              <h3 className="text-xl font-bold text-blue-800">
                Resumen Proyectado de tu Plan de Retiro
              </h3>
            </div>
            <CardContent>
              {/* Nueva tabla de proyección anual con paginación */}
              <div className="mb-6">
                <Button 
                  type="button"
                  onClick={() => setProyeccionAbierta(!proyeccionAbierta)}
                  variant="outline"
                  className="w-full mb-3 flex justify-between items-center py-2 border-stone-200 bg-stone-50"
                >
                  <span className="font-medium text-stone-800">Proyección por año de tu Plan de Retiro</span>
                  <span className={`transition-transform duration-200 ${proyeccionAbierta ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
                
                {proyeccionAbierta && resultados.proyeccionAnual && resultados.proyeccionAnual.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {(() => {
                      // Variables para la paginación
                      const filasProPagina = 10;
                      const totalPaginas = Math.ceil(resultados.proyeccionAnual.length / filasProPagina);
                      
                      // Mostrar solo 10 filas por página
                      const filasMostradas = resultados.proyeccionAnual.slice(
                        (paginaActual - 1) * filasProPagina,
                        paginaActual * filasProPagina
                      );
                      
                      return (
                        <>
                          <div className="overflow-x-auto mt-3 relative">
                            <table className="w-full border-collapse text-sm">
                              <thead>
                                <tr className="bg-stone-100">
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs sticky left-0 bg-stone-100 z-10">Año</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Edad</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Aportes del año</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Aportes acumulados</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Rendimiento del año</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Rendimiento acumulado</th>
                                  <th className="border border-stone-200 px-3 py-2 text-left text-stone-700 text-xs">Saldo final</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filasMostradas.map((proyeccion, index) => {
                                  const numeroFila = (paginaActual - 1) * filasProPagina + index;
                                  const añoActual = new Date().getFullYear() + numeroFila;
                                  const edadActual = formData.edad_actual + numeroFila;
                                  
                                  // Calcular aportes anuales (aprox. inversion_mensual * 12)
                                  const aportesAnuales = numeroFila === 0 
                                    ? resultados.capital_inicial + (resultados.inversion_mensual * 12)
                                    : resultados.inversion_mensual * 12 * Math.pow(1 + (uiValues.inflacionAnual / 100), numeroFila);
                                  
                                  // Rendimiento del año (diferencia entre saldo y aportes acumulados del año anterior más aportes anuales)
                                  let rendimientoAnual = 0;
                                  if (numeroFila === 0) {
                                    rendimientoAnual = proyeccion.rendimientoAcumulado;
                                  } else {
                                    const saldoAnterior = resultados.proyeccionAnual[numeroFila - 1].saldo;
                                    rendimientoAnual = proyeccion.saldo - saldoAnterior - aportesAnuales;
                                  }
                                  
                                  return (
                                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                                      <td className="border border-stone-200 px-3 py-1 text-xs sticky left-0 z-10 whitespace-nowrap font-medium shadow-sm" style={{backgroundColor: index % 2 === 0 ? 'white' : '#fafaf9'}}>{añoActual}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs">{edadActual}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs">{formatCurrency(aportesAnuales)}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs">{formatCurrency(proyeccion.aportesAcumulados)}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs text-emerald-600 font-medium">{formatCurrency(rendimientoAnual)}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs text-emerald-700 font-medium">{formatCurrency(proyeccion.rendimientoAcumulado)}</td>
                                      <td className="border border-stone-200 px-3 py-1 text-xs bg-blue-50 text-blue-700 font-medium">{formatCurrency(proyeccion.saldo)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Paginación */}
                          {totalPaginas > 1 && (
                            <div className="flex justify-between items-center mt-4">
                              <span className="text-xs text-stone-500">
                                Página {paginaActual} de {totalPaginas}
                              </span>
                              <div className="flex space-x-1">
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => cambiarPagina(1, totalPaginas)}
                                  disabled={paginaActual === 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Primera página</span>
                                  <span className="text-xs">«</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => cambiarPagina(paginaActual - 1, totalPaginas)}
                                  disabled={paginaActual === 1}
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Página anterior</span>
                                  <span className="text-xs">‹</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => cambiarPagina(paginaActual + 1, totalPaginas)}
                                  disabled={paginaActual === totalPaginas}
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Página siguiente</span>
                                  <span className="text-xs">›</span>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => cambiarPagina(totalPaginas, totalPaginas)}
                                  disabled={paginaActual === totalPaginas}
                                  className="h-8 w-8 p-0"
                                >
                                  <span className="sr-only">Última página</span>
                                  <span className="text-xs">»</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </div>
              
              {/* Intereses mensuales vs Costo de vida */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col">
                  <span className="text-stone-600 text-sm font-medium mb-1">COSTO DE VIDA MENSUAL AL RETIRARTE</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatCurrency(resultados.costo_vida_actualizado)}</span>
                  <span className="text-stone-600 text-sm mt-2">Actualizado por inflación anual del {uiValues.inflacionAnual}%</span>
                </div>
                
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col">
                  <span className="text-stone-600 text-sm font-medium mb-1">INTERESES MENSUALES GENERADOS</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatCurrency(resultados.monto_total * uiValues.rendimientoAnual / 100 / 12)}</span>
                  <span className="text-stone-600 text-sm mt-2">
                    {uiValues.rendimientoAnual === 0
                      ? "Con un rendimiento del 0%, no se generan intereses"
                      : resultados.monto_total * uiValues.rendimientoAnual / 100 / 12 >= resultados.costo_vida_actualizado 
                        ? "Suficientes para cubrir tu costo de vida" 
                        : "Insuficientes para tu costo de vida, necesitarás ir consumiendo capital"
                    }
                  </span>
                </div>
                
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col">
                  <span className="text-stone-600 text-sm font-medium mb-1">DURACIÓN DE TU CAPITAL</span>
                  <span className="text-stone-900 text-2xl font-bold">
                    {resultados.anios_retiro === "∞" ? "Perpetuo" : 
                      (() => {
                        const anios = Math.floor(parseFloat(resultados.anios_retiro.toString()));
                        const meses = Math.round((parseFloat(resultados.anios_retiro.toString()) - anios) * 12);
                        return `${anios} ${anios === 1 ? 'año' : 'años'}${meses > 0 ? ` y ${meses} ${meses === 1 ? 'mes' : 'meses'}` : ''}`;
                      })()
                    }
                  </span>
                  <span className="text-stone-600 text-sm mt-2">
                    {resultados.anios_retiro === "∞" 
                      ? "El capital no se agotará, dado que los intereses cobrados serán mayores al costo de vida" 
                      : "Tiempo antes de agotar el capital acumulado"
                    }
                  </span>
                </div>
              </div>
              
              {/* Indicador de Cobertura de Gastos */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-stone-600 mb-2">COBERTURA DE GASTOS MENSUALES</h3>
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                  {(() => {
                    const interesesMensuales = resultados.monto_total * uiValues.rendimientoAnual / 100 / 12;
                    const porcentajeCobertura = uiValues.rendimientoAnual === 0 ? 0 : (interesesMensuales / resultados.costo_vida_actualizado) * 100;
                    const estaCompleto = porcentajeCobertura >= 100;
                    
                    return (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-stone-600 text-sm">
                            {uiValues.rendimientoAnual === 0 
                              ? "Sin intereses que cubran tus gastos" 
                              : `Intereses cubren ${porcentajeCobertura.toFixed(1)}% de tus gastos`}
                          </span>
                          <span className="text-stone-800 font-medium">{formatCurrency(interesesMensuales)} / {formatCurrency(resultados.costo_vida_actualizado)}</span>
                        </div>
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${estaCompleto ? 'bg-green-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(porcentajeCobertura, 100)}%` }}
                          ></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Tiempo para independencia financiera */}
              <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <h3 className="text-sm font-medium text-stone-600 mb-2">TIEMPO PARA INDEPENDENCIA FINANCIERA</h3>
                {(() => {
                  // Si ya tenemos cobertura completa
                  const interesesMensuales = resultados.monto_total * uiValues.rendimientoAnual / 100 / 12;
                  if (interesesMensuales >= resultados.costo_vida_actualizado) {
                    return (
                      <p className="text-green-600 font-medium text-center">
                        {userName ? `¡Felicidades ${capitalizeName(userName)}!` : '¡Felicidades!'} Según las proyecciones, al llegar a la edad de retiro ({formData.edad_retiro} años) habrás alcanzado la independencia financiera. 
                        Los intereses mensuales ({formatCurrency(interesesMensuales)}) cubrirán todos tus gastos proyectados.
                      </p>
                    );
                  }
                  
                  // Calcular cuanto capital necesitamos
                  const capitalNecesario = uiValues.rendimientoAnual === 0 ? 
                    Infinity : (resultados.costo_vida_actualizado * 12) / (uiValues.rendimientoAnual / 100);
                  const capitalFaltante = capitalNecesario - resultados.monto_total;
                  
                  // Calcular cuánto aporte mensual adicional necesitarías para llegar a independencia financiera a la edad de retiro
                  const aniosHastaRetiro = formData.edad_retiro - formData.edad_actual;
                  const mesesHastaRetiro = aniosHastaRetiro * 12;
                  const tasaMensual = uiValues.rendimientoAnual / 100 / 12;
                  const inflacionMensual = uiValues.inflacionAnual / 100 / 12;
                  
                  let aporteNecesarioMensual;
                  
                  if (formData.actualizar_aporte_por_inflacion) {
                    // Cálculo ajustado considerando la actualización por inflación
                    // Usamos una aproximación más precisa para la capitalización con aportes actualizados
                    let montoProyectado = formData.capital_inicial;
                    let aporteBase = 1000; // Comenzamos con un valor base razonable
                    
                    // Método de aproximación iterativa
                    for (let intentos = 0; intentos < 12; intentos++) {
                      montoProyectado = formData.capital_inicial;
                      let aporteActual = aporteBase;
                      
                      // Simulamos el crecimiento con este aporte base
                      for (let i = 0; i < mesesHastaRetiro; i++) {
                        montoProyectado = (montoProyectado + aporteActual) * (1 + tasaMensual);
                        // Actualizar el aporte cada 12 meses por inflación
                        if ((i + 1) % 12 === 0) {
                          aporteActual *= (1 + (uiValues.inflacionAnual / 100));
                        }
                      }
                      
                      // Ajustar el aporte base para la próxima iteración
                      if (Math.abs(montoProyectado - capitalNecesario) < (capitalNecesario * 0.01)) {
                        // Si estamos dentro del 1% del objetivo, consideramos que es suficientemente preciso
                        break;
                      } else if (montoProyectado < capitalNecesario) {
                        aporteBase *= 1.2; // Aumentar si es insuficiente
                      } else {
                        aporteBase *= 0.8; // Disminuir si es excesivo
                      }
                    }
                    
                    aporteNecesarioMensual = aporteBase;
                  } else {
                    // Cálculo original sin actualización por inflación
                    const factorCapitalizacion = tasaMensual === 0 ?
                      mesesHastaRetiro : ((Math.pow(1 + tasaMensual, mesesHastaRetiro) - 1) / tasaMensual);
                    aporteNecesarioMensual = Math.max(0, capitalNecesario / factorCapitalizacion - (formData.capital_inicial * Math.pow(1 + tasaMensual, mesesHastaRetiro)) / factorCapitalizacion);
                  }
                  
                  const aporteAdicionalMensual = Math.max(0, aporteNecesarioMensual - formData.inversion_mensual);
                  
                  // Si no se logrará con los aportes actuales
                  if (aporteAdicionalMensual > 0) {
                    return (
                      <div className="text-center">
                        <p className="text-amber-600 mb-2">
                          {userName ? `${capitalizeName(userName)}, con tus aportes actuales` : 'Con tus aportes actuales'}, no lograrás la independencia financiera al momento de tu retiro.
                        </p>
                        <p className="text-stone-700">
                          Necesitarás un capital de {formatCurrency(capitalNecesario)} para cubrir tus gastos solo con intereses.
                          Al llegar a la edad de retiro, te faltarán {formatCurrency(capitalFaltante)}.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <p className="text-stone-800 font-medium mb-2">¿Quieres lograr independencia financiera a los {formData.edad_retiro} años?</p>
                          <p className="text-stone-700">
                            Necesitarías aportar <strong>{formatCurrency(aporteNecesarioMensual)}</strong> mensuales desde ahora hasta tu retiro.
                            {formData.actualizar_aporte_por_inflacion && (
                              <span className="block text-amber-700 text-sm mt-1 italic">
                                Este monto se incrementará anualmente según la inflación del {uiValues.inflacionAnual}%.
                              </span>
                            )}
                          </p>
                          <p className="text-amber-600 font-medium mt-2">
                            Eso significa <strong>{formatCurrency(aporteAdicionalMensual)}</strong> adicionales a tu aporte actual de {formatCurrency(formData.inversion_mensual)}.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="text-center">
                      <p className="text-green-600 font-medium">
                        {userName ? `¡Excelente ${capitalizeName(userName)}!` : '¡Excelente!'} Según nuestros cálculos, con tus aportes actuales alcanzarás la independencia financiera a la edad de retiro.
                      </p>
                    </div>
                  );
                })()}
              </div>
              
              {/* Sección de Preguntas y Respuestas */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-stone-800 mb-4">
                  {userName ? `${capitalizeName(userName)}, estas son algunas preguntas frecuentes sobre tu plan` : 'Preguntas Frecuentes sobre tu Plan de Retiro'}
                </h3>
                
                {/* Pregunta 1: ¿Qué es la independencia financiera? */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta1' ? null : 'pregunta1')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left pr-4">¿Qué significa que puedo vivir de los intereses?</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${activeInfoBox === 'pregunta1' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta1' && (
                    <div className="p-4 bg-white">
                      <p className="text-stone-700 mb-2">
                        Vivir de los intereses significa que el dinero que genera tu capital invertido cada mes (los intereses) 
                        es suficiente para cubrir todos tus gastos mensuales, sin necesidad de tocar el capital principal.
                      </p>
                      <p className="text-stone-700">
                        En tu caso, necesitas generar <strong>{formatCurrency(resultados.costo_vida_actualizado)}</strong> mensuales para mantener 
                        tu nivel de vida. {uiValues.rendimientoAnual === 0 
                          ? "Con un rendimiento anual del 0%, no es posible generar intereses para cubrir tus gastos."
                          : `Con un rendimiento anual del ${uiValues.rendimientoAnual}%, necesitas un capital de `
                        }
                        {uiValues.rendimientoAnual > 0 && (
                          <strong>{formatCurrency((resultados.costo_vida_actualizado * 12) / (uiValues.rendimientoAnual / 100))}</strong>
                        )}
                        {uiValues.rendimientoAnual > 0 && " para generar esos intereses mensualmente."}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Pregunta 2: ¿Cuál es la diferencia entre mi monto invertido y mi ganancia? */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta2' ? null : 'pregunta2')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left pr-4">¿Cuál es la diferencia entre mi monto invertido y mi ganancia?</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${activeInfoBox === 'pregunta2' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta2' && (
                    <div className="p-4 bg-white">
                      <p className="text-stone-700 mb-3">
                        Tu monto invertido es todo el dinero que has puesto en la inversión, compuesto por tu capital inicial 
                        (<strong>{formatCurrency(resultados.capital_inicial)}</strong>) más todos tus aportes mensuales 
                        (<strong>{formatCurrency(resultados.total_aportes_mensuales)}</strong>), 
                        sumando un total de <strong>{formatCurrency(resultados.total_invertido)}</strong>.
                      </p>
                      <p className="text-stone-700 mb-3">
                        Tu ganancia (<strong>{formatCurrency(resultados.ganancia_neta)}</strong>) es 
                        el dinero extra que ha generado tu inversión gracias al interés compuesto, sin que tú hayas tenido que aportarlo.
                      </p>
                      <p className="text-stone-700">
                        El interés compuesto ha multiplicado tu inversión por <strong>{((resultados.monto_total / resultados.total_invertido).toFixed(2))}</strong>, 
                        transformando tus <strong>{formatCurrency(resultados.total_invertido)}</strong> invertidos 
                        en <strong>{formatCurrency(resultados.monto_total)}</strong> al final del período.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Pregunta 3: ¿Qué pasa si no llego a la independencia financiera? */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta3' ? null : 'pregunta3')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left pr-4">¿Qué significa la duración de mi capital?</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${activeInfoBox === 'pregunta3' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta3' && (
                    <div className="p-4 bg-white">
                      {resultados.anios_retiro === "∞" ? (
                        <p className="text-stone-700">
                          {uiValues.rendimientoAnual === 0 ? 
                            "Con un rendimiento del 0%, tu capital no generará intereses para cubrir tus gastos, por lo que eventualmente se agotará a menos que tus gastos sean cero." :
                            `En tu caso, ¡buenas noticias! Los intereses que generará tu capital (`
                          }
                          {uiValues.rendimientoAnual > 0 && (
                            <strong>{formatCurrency(resultados.monto_total * uiValues.rendimientoAnual / 100 / 12)}</strong>
                          )}
                          {uiValues.rendimientoAnual > 0 && ` mensuales) 
                            superan tus gastos mensuales (`}
                          {uiValues.rendimientoAnual > 0 && (
                            <strong>{formatCurrency(resultados.costo_vida_actualizado)}</strong>
                          )}
                          {uiValues.rendimientoAnual > 0 && `), 
                            por lo que tu capital nunca se agotará. De hecho, seguirá creciendo incluso durante tu retiro, permitiéndote aumentar 
                            tu nivel de vida o dejar una herencia.`}
                        </p>
                      ) : (
                        <>
                          <p className="text-stone-700 mb-2">
                            La duración de tu capital es el tiempo que podrás mantener tu nivel de vida antes de quedarte sin dinero. 
                            En tu caso, el capital se agotará después de <strong>
                            {(() => {
                              const anios = Math.floor(parseFloat(resultados.anios_retiro.toString()));
                              const meses = Math.round((parseFloat(resultados.anios_retiro.toString()) - anios) * 12);
                              return `${anios} ${anios === 1 ? 'año' : 'años'}${meses > 0 ? ` y ${meses} ${meses === 1 ? 'mes' : 'meses'}` : ''}`;
                            })()}
                            </strong>.
                          </p>
                          <p className="text-stone-700 mb-2">
                            Esto sucede porque tus gastos mensuales (<strong>{formatCurrency(resultados.costo_vida_actualizado)}</strong>) 
                            {uiValues.rendimientoAnual === 0 ?
                              " no pueden ser cubiertos por intereses, ya que con un rendimiento del 0% no se generan intereses." :
                              ` son mayores que los intereses que genera tu capital (`
                            }
                            {uiValues.rendimientoAnual > 0 && (
                              <strong>{formatCurrency(resultados.monto_total * uiValues.rendimientoAnual / 100 / 12)}</strong>
                            )}
                            {uiValues.rendimientoAnual > 0 && ` mensuales), 
                              por lo que cada mes consumirás una parte de tu capital principal hasta agotarlo.`}
                          </p>
                          <p className="text-stone-700">
                            Para aumentar la duración de tu capital, puedes: (1) incrementar tu capital acumulado antes del retiro, 
                            (2) reducir tus gastos mensuales de retiro, o (3) buscar inversiones con mayor rendimiento (aunque esto 
                            generalmente implica más riesgo).
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Pregunta 4: ¿Qué es el aporte mensual óptimo? */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta4' ? null : 'pregunta4')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left pr-4">¿Qué debo cambiar para mejorar mi plan de retiro?</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${activeInfoBox === 'pregunta4' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta4' && (
                    <div className="p-4 bg-white">
                      {(() => {
                        // Preparar datos para las recomendaciones
                        const aniosRestantes = formData.edad_retiro - formData.edad_actual;
                        const mesesRestantes = aniosRestantes * 12;
                        const interesesMensuales = resultados.monto_total * uiValues.rendimientoAnual / 100 / 12;
                        const capitalNecesario = uiValues.rendimientoAnual === 0 ? 
                          Infinity : (resultados.costo_vida_actualizado * 12) / (uiValues.rendimientoAnual / 100);
                        const capitalFaltante = capitalNecesario - resultados.monto_total;
                        
                        const tasaMensual = uiValues.rendimientoAnual / 100 / 12;
                        
                        // Usar la misma lógica que en la sección de independencia financiera
                        let aporteOptimoMensual;
                        
                        if (formData.actualizar_aporte_por_inflacion) {
                          // Cálculo ajustado considerando la actualización por inflación
                          // Usamos una aproximación más precisa para la capitalización con aportes actualizados
                          let montoProyectado = formData.capital_inicial;
                          let aporteBase = 1000; // Comenzamos con un valor base razonable
                          
                          // Método de aproximación iterativa
                          for (let intentos = 0; intentos < 12; intentos++) {
                            montoProyectado = formData.capital_inicial;
                            let aporteActual = aporteBase;
                            
                            // Simulamos el crecimiento con este aporte base
                            for (let i = 0; i < mesesRestantes; i++) {
                              montoProyectado = (montoProyectado + aporteActual) * (1 + tasaMensual);
                              // Actualizar el aporte cada 12 meses por inflación
                              if ((i + 1) % 12 === 0) {
                                aporteActual *= (1 + (uiValues.inflacionAnual / 100));
                              }
                            }
                            
                            // Ajustar el aporte base para la próxima iteración
                            if (Math.abs(montoProyectado - capitalNecesario) < (capitalNecesario * 0.01)) {
                              // Si estamos dentro del 1% del objetivo, consideramos que es suficientemente preciso
                              break;
                            } else if (montoProyectado < capitalNecesario) {
                              aporteBase *= 1.2; // Aumentar si es insuficiente
                            } else {
                              aporteBase *= 0.8; // Disminuir si es excesivo
                            }
                          }
                          
                          aporteOptimoMensual = aporteBase;
                        } else {
                          // Cálculo original sin actualización por inflación
                          const factorCapitalizado = tasaMensual === 0 ? 
                            mesesRestantes : ((Math.pow(1 + tasaMensual, mesesRestantes) - 1) / tasaMensual);
                          aporteOptimoMensual = Math.max(0, capitalFaltante / factorCapitalizado);
                        }
                        
                        const aporteTotal = aporteOptimoMensual + formData.inversion_mensual;
                        
                        // Si ya alcanzaste independencia financiera
                        if (interesesMensuales >= resultados.costo_vida_actualizado) {
                          return (
                            <p className="text-stone-700">
                              ¡Ya has alcanzado un excelente plan de retiro! Tu capital generará suficientes intereses para cubrir
                              todos tus gastos. Si quieres mejorar aún más, podrías:
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Seguir aportando para incrementar tu nivel de vida en el retiro</li>
                                <li>Diversificar tus inversiones para protegerte contra imprevistos</li>
                                <li>Planificar cómo quieres utilizar el excedente (viajes, hobbies, herencia, etc.)</li>
                              </ul>
                            </p>
                          );
                        }
                        
                        return (
                          <>
                            <p className="text-stone-700 mb-3">
                              Hay varias formas de mejorar tu plan de retiro:
                            </p>
                            <div className="space-y-3">
                              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                                <p className="font-medium mb-1">1. Aumentar tu aporte mensual</p>
                                <p className="text-sm">
                                  Aportar <strong>un adicional de {formatCurrency(aporteOptimoMensual)}</strong> (además de tus {formatCurrency(formData.inversion_mensual)} actuales) 
                                  para llegar a un total de <strong>{formatCurrency(aporteTotal)}</strong> mensuales te permitiría 
                                  alcanzar la independencia financiera justo para tu edad de retiro.
                                </p>
                              </div>
                              
                              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                                <p className="font-medium mb-1">2. Reducir tus gastos futuros</p>
                                <p className="text-sm">
                                  Si pudieras reducir tus gastos mensuales proyectados de {formatCurrency(resultados.costo_vida_actualizado)} a {' '}
                                  {formatCurrency(interesesMensuales)}, podrías vivir indefinidamente de los intereses.
                                </p>
                              </div>
                              
                              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                                <p className="font-medium mb-1">3. Extender tu horizonte de inversión</p>
                                <p className="text-sm">
                                  {uiValues.rendimientoAnual === 0 
                                    ? "Con un rendimiento del 0%, no es posible alcanzar la independencia financiera solo extendiendo el horizonte de inversión."
                                    : `Si mantuvieras tu aporte actual pero trabajaras más años, necesitarías aproximadamente ${Math.ceil((Math.log(capitalNecesario / resultados.monto_total) / Math.log(1 + uiValues.rendimientoAnual / 100)) + aniosRestantes)} años en total para alcanzar la independencia financiera (en lugar de ${aniosRestantes}).`
                                  }
                                </p>
                              </div>
                              
                              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                                <p className="font-medium mb-1">4. Buscar un mayor rendimiento</p>
                                <p className="text-sm">
                                  Si pudieras aumentar tu rendimiento anual del {uiValues.rendimientoAnual}% al {(uiValues.rendimientoAnual * 1.5).toFixed(1)}%, 
                                  alcanzarías la independencia financiera más rápido, aunque esto generalmente implica asumir más riesgo.
                                </p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
                
                {/* Nueva Pregunta 5: ¿Cuál es mi tasa de retiro segura? */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta5' ? null : 'pregunta5')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left pr-4">¿Cuál es mi tasa de retiro segura?</span>
                    <span className={`flex-shrink-0 transition-transform duration-200 ${activeInfoBox === 'pregunta5' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta5' && (
                    <div className="p-4 bg-white">
                      {(() => {
                        // Calcular la tasa de retiro segura basada en el rendimiento anual
                        const tasaRetiroSeguraAnual = uiValues.rendimientoAnual === 0 ? 0 : Math.min(4, uiValues.rendimientoAnual * 0.8);
                        
                        // Calcular el monto mensual seguro que puede retirar
                        const montoRetiroSeguroMensual = (resultados.monto_total * (tasaRetiroSeguraAnual / 100)) / 12;
                        
                        // Porcentaje que representa del costo de vida deseado
                        const porcentajeCobertura = resultados.costo_vida_actualizado === 0 ? 
                          100 : (montoRetiroSeguroMensual / resultados.costo_vida_actualizado) * 100;
                        
                        return (
                          <>
                            <div className="mb-4">
                              <p className="text-stone-700 mb-3">
                                La tasa de retiro segura es el porcentaje de tu capital que puedes retirar anualmente con 
                                una alta probabilidad de que tu dinero dure toda tu vida, incluso considerando 
                                períodos de volatilidad en los mercados.
                              </p>
                              
                              <p className="text-stone-700 mb-3">
                                Basado en estudios financieros históricos y considerando tu rendimiento anual del {uiValues.rendimientoAnual}%, 
                                una tasa de retiro segura para ti sería aproximadamente del <strong>{tasaRetiroSeguraAnual.toFixed(1)}% anual</strong>.
                              </p>
                            </div>
                            
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                              <h4 className="font-medium text-blue-800 mb-2">Tu retiro seguro mensual</h4>
                              <p className="text-lg font-bold text-blue-700 mb-2">{formatCurrency(montoRetiroSeguroMensual)}</p>
                              <p className="text-sm text-blue-600">
                                Este es el monto que podrías retirar mensualmente con una alta probabilidad de que tu capital dure toda tu vida.
                              </p>
                            </div>
                            
                            {montoRetiroSeguroMensual < resultados.costo_vida_actualizado ? (
                              <div>
                                <p className="text-amber-700 mb-3">
                                  Este monto representa el <strong>{porcentajeCobertura.toFixed(1)}%</strong> de tu costo de vida deseado 
                                  de {formatCurrency(resultados.costo_vida_actualizado)}.
                                </p>
                                <p className="text-stone-700">
                                  Para cubrir el 100% de tus gastos siguiendo esta estrategia conservadora, necesitarías acumular aproximadamente {' '}
                                  <strong>{formatCurrency((resultados.costo_vida_actualizado * 12) / (tasaRetiroSeguraAnual / 100))}</strong> 
                                  antes de retirarte, o bien ajustar tu costo de vida mensual a {formatCurrency(montoRetiroSeguroMensual)}.
                                </p>
                              </div>
                            ) : (
                              <p className="text-green-700">
                                ¡Buenas noticias! Este monto cubre el <strong>{Math.min(porcentajeCobertura, 100).toFixed(1)}%</strong> de tu costo de vida deseado. 
                                Podrías retirar hasta {formatCurrency(montoRetiroSeguroMensual)} mensuales manteniendo la seguridad de que tu capital durará a largo plazo.
                              </p>
                            )}
                            
                            <div className="mt-4 text-sm text-stone-500">
                              <p className="italic">
                                Nota: La tasa de retiro segura tradicional es del 4% anual, pero la adaptamos según tu rendimiento esperado. 
                                Esta es una referencia conservadora diseñada para soportar incluso períodos de mercado adversos.
                              </p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="mt-8 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <h4 className="font-medium text-stone-800 mb-2 text-sm">AVISO IMPORTANTE</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Esta calculadora proporciona estimaciones con fines exclusivamente educativos e informativos. Los resultados mostrados no constituyen asesoramiento financiero ni garantía de rendimiento futuro. Los rendimientos de las inversiones son variables y pueden fluctuar significativamente en función de numerosos factores de mercado. Las proyecciones presentadas ilustran el potencial del interés compuesto a largo plazo, pero se basan en tasas fijas que no reflejan la volatilidad real de los mercados financieros. Los cálculos no consideran factores como impuestos, comisiones, cambios regulatorios o condiciones económicas imprevistas. Antes de tomar cualquier decisión de inversión, se recomienda consultar con un asesor financiero cualificado. Al utilizar esta herramienta, reconoces que las proyecciones son hipotéticas y no responsabilizas a los creadores por decisiones financieras tomadas con base en estos resultados.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 