'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import { InfoIcon, XIcon, RefreshCw, ArrowRight, ArrowLeft, Calculator } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'

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
}

interface FormData {
  // Datos personales
  edad_actual: number
  edad_retiro: number
  costo_vida_mensual: number
  // Datos de inversión
  capital_inicial: number
  inversion_mensual: number
  rendimiento_anual: number
  inflacion_anual: number
}

export default function CalculadoraForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [resultados, setResultados] = useState<ResultadosInversion | null>(null)
  const [formData, setFormData] = useState<FormData>({
    edad_actual: 0,
    edad_retiro: 0,
    costo_vida_mensual: 0,
    capital_inicial: 0,
    inversion_mensual: 0,
    rendimiento_anual: 6, // Valor por defecto actualizado a 6%
    inflacion_anual: 3.5
  })
  const [formStep, setFormStep] = useState(0) // 0 = datos personales, 1 = datos de inversión
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeInfoBox, setActiveInfoBox] = useState<string | null>(null)
  const [inflacionPersonalizada, setInflacionPersonalizada] = useState(false)
  const [rendimientoPersonalizado, setRendimientoPersonalizado] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // Validar todos los campos antes de enviar
    const errors = validateAllFields()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      // Si hay errores en la pestaña de datos personales, cambiar a esa pestaña
      if (errors.edad_actual || errors.edad_retiro || errors.costo_vida_mensual) {
        setFormStep(0)
      }
      return
    }
    
    setIsLoading(true)

    // Calcular total_anios basado en edad_actual y edad_retiro
    const total_anios = formData.edad_retiro - formData.edad_actual

    const data = {
      capital_inicial: formData.capital_inicial,
      inversion_mensual: formData.inversion_mensual,
      tasa_anual: formData.rendimiento_anual,
      inflacion_anual: formData.inflacion_anual,
      total_anios: total_anios,
      costo_vida_mensual: formData.costo_vida_mensual,
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
      
      // Mejorar el mensaje de retiro cuando el capital no se agotará
      if (result.anios_retiro === "∞") {
        // Simplemente usamos los valores ya proporcionados por la API
        result.mensaje_retiro = `¡Excelente noticia! Tu capital no se agotará nunca, ya que el dinero que recibirás mensualmente producto de los intereses (${formatCurrency(result.monto_total * formData.rendimiento_anual / 100 / 12)}) será mayor que lo que necesitas retirar para cubrir tus gastos según el costo de vida proyectado al momento de tu retiro (${formatCurrency(result.costo_vida_actualizado)}).`;
      }
      
      setResultados(result)
      
      // Desplazamiento automático hacia los resultados
      setTimeout(() => {
        const resultadosElement = document.getElementById('resultados-section');
        if (resultadosElement) {
          resultadosElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error:', error)
      alert('Error al realizar el cálculo. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const validateAllFields = () => {
    const errors: Record<string, string> = {}
    
    // Validar datos personales
    if (!formData.edad_actual) errors.edad_actual = "La edad actual es requerida"
    if (!formData.edad_retiro) errors.edad_retiro = "La edad de retiro es requerida"
    if (formData.edad_retiro <= formData.edad_actual) errors.edad_retiro = "La edad de retiro debe ser mayor a la edad actual"
    if (!formData.costo_vida_mensual) errors.costo_vida_mensual = "El costo de vida mensual es requerido"
    
    // Validar datos de inversión
    if (!formData.capital_inicial && !formData.inversion_mensual) errors.capital_inicial = "Debes ingresar al menos un capital inicial o un aporte mensual"
    if (!formData.rendimiento_anual) errors.rendimiento_anual = "El rendimiento de la inversión es requerido"
    
    return errors
  }
  
  const validatePersonalData = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.edad_actual) errors.edad_actual = "La edad actual es requerida"
    if (!formData.edad_retiro) errors.edad_retiro = "La edad de retiro es requerida"
    if (formData.edad_retiro <= formData.edad_actual) errors.edad_retiro = "La edad de retiro debe ser mayor a la edad actual"
    if (!formData.costo_vida_mensual) errors.costo_vida_mensual = "El costo de vida mensual es requerido"
    
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
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-4">Calculadora de Retiro</h1>
        <p className="text-lg text-stone-600 mb-8">
          Planifica tu futuro financiero calculando el potencial de tus ahorros para un retiro cómodo
        </p>
      </div>

      <Card id="calculadora-form">
        <CardHeader>
          <CardTitle>Ingresa tus datos</CardTitle>
          <CardDescription>
            Completa todos los campos para calcular tu plan de retiro
          </CardDescription>
        </CardHeader>
        
        {/* Progress indicator */}
        <div className="px-6">
          <div className="w-full bg-gray-100 h-2 rounded-full mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: formStep === 0 ? '50%' : '100%' }}
            />
          </div>
          <div className="flex justify-between mb-6">
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 0 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'} mx-auto mb-2`}>
                1
              </div>
              <span className={`text-sm font-medium ${formStep === 0 ? 'text-primary' : 'text-gray-600'}`}>
                Datos Personales
              </span>
            </div>
            <div className="text-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formStep === 1 ? 'bg-primary text-white' : 'bg-primary/20 text-primary'} mx-auto mb-2`}>
                2
              </div>
              <span className={`text-sm font-medium ${formStep === 1 ? 'text-primary' : 'text-gray-600'}`}>
                Datos de Inversión
              </span>
            </div>
          </div>
        </div>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {formStep === 0 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="edad_actual">Tu Edad Actual</Label>
                      <Input
                        id="edad_actual"
                        name="edad_actual"
                        type="number"
                        placeholder="Ej: 30"
                        min="0"
                        step="1"
                        required
                        value={formData.edad_actual || ''}
                        onChange={handleChange}
                        className={validationErrors.edad_actual ? "border-red-500" : ""}
                      />
                      {validationErrors.edad_actual && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.edad_actual}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edad_retiro">Tu Edad de Retiro</Label>
                      <Input
                        id="edad_retiro"
                        name="edad_retiro"
                        type="number"
                        placeholder="Ej: 65"
                        min="0"
                        step="1"
                        required
                        value={formData.edad_retiro || ''}
                        onChange={handleChange}
                        className={validationErrors.edad_retiro ? "border-red-500" : ""}
                      />
                      {validationErrors.edad_retiro && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.edad_retiro}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="costo_vida_mensual">Tu Costo de Vida Mensual al Retirarte (USD)</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 hover:bg-stone-100 focus:ring-2 focus:ring-stone-200"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveInfoBox(activeInfoBox === 'costo_vida_mensual' ? null : 'costo_vida_mensual');
                          }}
                        >
                          <InfoIcon className="h-4 w-4 text-stone-500" />
                          <span className="sr-only">Información sobre Costo de Vida Mensual</span>
                        </Button>
                      </div>
                      {activeInfoBox === 'costo_vida_mensual' && (
                        <div className="bg-white p-3 rounded-md shadow-md border border-stone-200 mb-2 relative">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0 absolute top-2 right-2"
                            onClick={() => setActiveInfoBox(null)}
                          >
                            <XIcon className="h-3 w-3 text-stone-500" />
                          </Button>
                          <p className="text-sm text-stone-700 pr-6">
                            Importe en dólares que estimas gastar mensualmente al momento de encontrarte retirado (cuando no poseas ingresos activos por no estar trabajando).
                          </p>
                        </div>
                      )}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                        <Input
                          id="costo_vida_mensual"
                          name="costo_vida_mensual"
                          type="number"
                          placeholder="Ej: 2000"
                          min="0"
                          step="0.01"
                          required
                          className={`pl-8 ${validationErrors.costo_vida_mensual ? "border-red-500" : ""}`}
                          value={formData.costo_vida_mensual || ''}
                          onChange={handleChange}
                        />
                        {validationErrors.costo_vida_mensual && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.costo_vida_mensual}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              {formStep === 1 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="capital_inicial">Tu Capital Inicial (USD)</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 hover:bg-stone-100 focus:ring-2 focus:ring-stone-200"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveInfoBox(activeInfoBox === 'capital_inicial' ? null : 'capital_inicial');
                          }}
                        >
                          <InfoIcon className="h-4 w-4 text-stone-500" />
                          <span className="sr-only">Información sobre Capital Inicial</span>
                        </Button>
                      </div>
                      {activeInfoBox === 'capital_inicial' && (
                        <div className="bg-white p-3 rounded-md shadow-md border border-stone-200 mb-2 relative">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0 absolute top-2 right-2"
                            onClick={() => setActiveInfoBox(null)}
                          >
                            <XIcon className="h-3 w-3 text-stone-500" />
                          </Button>
                          <p className="text-sm text-stone-700 pr-6">
                            Dinero que ya tienes al momento de comenzar la inversión, que estás dispuesto a invertir y no retirar hasta la pasividad.
                          </p>
                        </div>
                      )}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                        <Input
                          id="capital_inicial"
                          name="capital_inicial"
                          type="number"
                          placeholder="Ej: 10000"
                          min="0"
                          step="0.01"
                          className={`pl-8 ${validationErrors.capital_inicial ? "border-red-500" : ""}`}
                          value={formData.capital_inicial || ''}
                          onChange={handleChange}
                        />
                        {validationErrors.capital_inicial && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.capital_inicial}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="inversion_mensual">Tu Aporte Mensual (USD)</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 p-0 hover:bg-stone-100 focus:ring-2 focus:ring-stone-200"
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveInfoBox(activeInfoBox === 'inversion_mensual' ? null : 'inversion_mensual');
                          }}
                        >
                          <InfoIcon className="h-4 w-4 text-stone-500" />
                          <span className="sr-only">Información sobre Aporte Mensual</span>
                        </Button>
                      </div>
                      {activeInfoBox === 'inversion_mensual' && (
                        <div className="bg-white p-3 rounded-md shadow-md border border-stone-200 mb-2 relative">
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 p-0 absolute top-2 right-2"
                            onClick={() => setActiveInfoBox(null)}
                          >
                            <XIcon className="h-3 w-3 text-stone-500" />
                          </Button>
                          <p className="text-sm text-stone-700 pr-6">
                            Importe promedio que estimas aportar a la inversión mensualmente y sin excepción, para incrementar el monto invertido y aprovechar al máximo los efectos positivos del interés compuesto.
                          </p>
                        </div>
                      )}
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                        <Input
                          id="inversion_mensual"
                          name="inversion_mensual"
                          type="number"
                          placeholder="Ej: 500"
                          min="0"
                          step="0.01"
                          className="pl-8"
                          value={formData.inversion_mensual || ''}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rendimiento_anual">Rendimiento de Tu Inversión (TNA %)</Label>
                      <div className="relative flex flex-col space-y-2">
                        <Select
                          value={
                            formData.rendimiento_anual === 3 ? "conservadora" :
                            formData.rendimiento_anual === 6 ? "moderada" :
                            formData.rendimiento_anual === 9 ? "arriesgada" :
                            "otro"
                          }
                          onValueChange={(value) => {
                            if (value === "conservadora") {
                              setRendimientoPersonalizado(false);
                              setFormData(prev => ({ ...prev, rendimiento_anual: 3 }));
                            } else if (value === "moderada") {
                              setRendimientoPersonalizado(false);
                              setFormData(prev => ({ ...prev, rendimiento_anual: 6 }));
                            } else if (value === "arriesgada") {
                              setRendimientoPersonalizado(false);
                              setFormData(prev => ({ ...prev, rendimiento_anual: 9 }));
                            } else if (value === "otro") {
                              setRendimientoPersonalizado(true);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar rendimiento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="conservadora">Conservadora (3%)</SelectItem>
                            <SelectItem value="moderada">Moderada (6%)</SelectItem>
                            <SelectItem value="arriesgada">Arriesgada (9%)</SelectItem>
                            <SelectItem value="otro">Otro valor</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {rendimientoPersonalizado && (
                          <div className="relative mt-2">
                            <Input
                              id="rendimiento_anual_personalizado"
                              name="rendimiento_anual_personalizado"
                              type="number"
                              placeholder="Ingresa un valor personalizado"
                              min="0"
                              step="0.1"
                              className="pr-8"
                              value={formData.rendimiento_anual}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  rendimiento_anual: parseFloat(e.target.value) || 0
                                }))
                              }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                          </div>
                        )}

                        {!rendimientoPersonalizado && (
                          <p className="text-sm text-slate-500 mt-1">
                            Rendimiento promedio esperado en USD: {formData.rendimiento_anual}%
                          </p>
                        )}
                        
                        {validationErrors.rendimiento_anual && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.rendimiento_anual}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inflacion_anual">Inflación Anual Esperada (%)</Label>
                      <div className="relative flex flex-col space-y-2">
                        <Select
                          value={
                            formData.inflacion_anual === 1.5 ? "baja" :
                            formData.inflacion_anual === 3.5 ? "moderada" :
                            formData.inflacion_anual === 6 ? "alta" :
                            "otro"
                          }
                          onValueChange={(value) => {
                            if (value === "baja") {
                              setInflacionPersonalizada(false);
                              setFormData(prev => ({ ...prev, inflacion_anual: 1.5 }));
                            } else if (value === "moderada") {
                              setInflacionPersonalizada(false);
                              setFormData(prev => ({ ...prev, inflacion_anual: 3.5 }));
                            } else if (value === "alta") {
                              setInflacionPersonalizada(false);
                              setFormData(prev => ({ ...prev, inflacion_anual: 6 }));
                            } else if (value === "otro") {
                              setInflacionPersonalizada(true);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar inflación" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baja">Baja (1.5%)</SelectItem>
                            <SelectItem value="moderada">Moderada (3.5%)</SelectItem>
                            <SelectItem value="alta">Alta (6%)</SelectItem>
                            <SelectItem value="otro">Otro valor</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {inflacionPersonalizada && (
                          <div className="relative mt-2">
                            <Input
                              id="inflacion_anual_personalizado"
                              name="inflacion_anual_personalizado"
                              type="number"
                              placeholder="Ingresa un valor personalizado"
                              min="0"
                              step="0.1"
                              className="pr-8"
                              value={formData.inflacion_anual}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  inflacion_anual: parseFloat(e.target.value) || 0
                                }))
                              }}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                          </div>
                        )}

                        {!inflacionPersonalizada && (
                          <p className="text-sm text-slate-500 mt-1">
                            Inflación promedio esperada en USD: {formData.inflacion_anual}%
                          </p>
                        )}
                        
                        {validationErrors.inflacion_anual && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.inflacion_anual}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-3 pt-0">
          {formStep === 0 ? (
            <Button 
              type="button" 
              onClick={handleNextStep} 
              className="w-full"
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button 
                type="button" 
                onClick={handlePrevStep} 
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Datos Personales
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(new Event('submit') as unknown as React.FormEvent<HTMLFormElement>);
                }}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Calculando...' : 'Proyectar Rendimiento'}
                <Calculator className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      {resultados && (
        <>
          <div className="flex justify-center mt-6 mb-4">
            <Button 
              type="button" 
              onClick={handleReset} 
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-400 font-medium px-8 py-3 text-base flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Resetear valores de inversión
            </Button>
          </div>
          
          <Card className="mt-2" id="resultados-section">
            <CardHeader>
              <CardTitle>Resumen Proyectado de tu Plan de Retiro</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Resultados principales destacados en tarjetas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col shadow-sm">
                  <span className="text-stone-600 text-sm font-medium mb-1">MONTO FINAL ACUMULADO</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatCurrency(resultados.monto_total)}</span>
                  <span className="text-stone-600 text-sm mt-2">Total a la edad de {formData.edad_retiro} años</span>
                </div>
                
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5"></div>
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <span className="text-primary text-sm font-semibold mb-1 relative z-10">GANANCIA NETA OBTENIDA</span>
                  <span className="text-stone-900 text-2xl font-bold relative z-10">{formatCurrency(resultados.ganancia_neta)}</span>
                  <span className="text-primary-700 text-sm mt-2 relative z-10">+{((resultados.ganancia_neta / resultados.total_invertido) * 100).toFixed(0)}% sobre capital invertido</span>
                </div>
                
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col shadow-sm">
                  <span className="text-stone-600 text-sm font-medium mb-1">DURACIÓN DE TU CAPITAL</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatYears(resultados.anios_retiro)}</span>
                  <span className="text-stone-600 text-sm mt-2">{resultados.anios_retiro === "∞" ? "Tu capital se mantendrá indefinidamente" : "Tiempo estimado antes de agotar el capital"}</span>
                </div>
              </div>
              
              {/* Intereses mensuales vs Costo de vida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col">
                  <span className="text-stone-600 text-sm font-medium mb-1">COSTO DE VIDA MENSUAL AL RETIRARTE</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatCurrency(resultados.costo_vida_actualizado)}</span>
                  <span className="text-stone-600 text-sm mt-2">Actualizado por inflación anual del {formData.inflacion_anual}%</span>
                </div>
                
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200 flex flex-col">
                  <span className="text-stone-600 text-sm font-medium mb-1">INTERESES MENSUALES GENERADOS</span>
                  <span className="text-stone-900 text-2xl font-bold">{formatCurrency(resultados.monto_total * (formData.rendimiento_anual / 100 / 12))}</span>
                  <span className="text-stone-600 text-sm mt-2">
                    {resultados.monto_total * (formData.rendimiento_anual / 100 / 12) >= resultados.costo_vida_actualizado 
                      ? "Suficientes para cubrir tu costo de vida" 
                      : "Insuficientes para tu costo de vida, necesitarás ir consumiendo capital"}
                  </span>
                </div>
              </div>
              
              {/* Tabla de detalles adicionales */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-stone-800 mb-3">Detalles de tu inversión</h3>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium w-1/3">Capital Inicial:</TableCell>
                      <TableCell className="w-2/3">{formatCurrency(resultados.capital_inicial)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Aporte Mensual:</TableCell>
                      <TableCell>{formatCurrency(resultados.inversion_mensual)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Aportado:</TableCell>
                      <TableCell>{formatCurrency(resultados.total_aportes_mensuales)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Total Invertido:</TableCell>
                      <TableCell>{formatCurrency(resultados.total_invertido)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Costo de Vida Mensual Actual:</TableCell>
                      <TableCell>{formatCurrency(resultados.costo_vida_inicial)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              {/* Mensaje de retiro con explicación mejorada */}
              <div className="mb-6 p-4 bg-stone-50 rounded-lg border border-stone-200">
                <p className="text-center text-stone-700">
                  {resultados.anios_retiro === "∞" ? 
                    `¡Excelente! Tu capital no se agotará nunca porque tus intereses mensuales (${formatCurrency(resultados.monto_total * formData.rendimiento_anual / 100 / 12)}) superan tu costo de vida proyectado (${formatCurrency(resultados.costo_vida_actualizado)}).` : 
                    `Con un capital acumulado de ${formatCurrency(resultados.monto_total)}, podrás mantener tu nivel de vida durante ${formatYears(resultados.anios_retiro)} retirando mensualmente ${formatCurrency(resultados.costo_vida_actualizado)} para cubrir tus gastos.`
                  }
                </p>
                
                {resultados.anios_retiro !== "∞" && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <p className="text-center text-stone-700">
                      {(() => {
                        // Calcular el capital necesario para vivir solo de intereses
                        const capitalNecesario = resultados.costo_vida_actualizado * 12 / (formData.rendimiento_anual / 100);
                        
                        // Calcular el aporte mensual necesario para alcanzar ese capital
                        const totalMeses = (formData.edad_retiro - formData.edad_actual) * 12;
                        const tasaMensual = formData.rendimiento_anual / 100 / 12;
                        
                        // Fórmula de aportes periódicos con interés compuesto resuelto para el aporte mensual
                        // PMT = (FV - PV * (1 + r)^n) / (((1 + r)^n - 1) / r)
                        const factorCapitalInicial = Math.pow(1 + tasaMensual, totalMeses);
                        const factorAportes = (factorCapitalInicial - 1) / tasaMensual;
                        const aporteNecesario = (capitalNecesario - formData.capital_inicial * factorCapitalInicial) / factorAportes;
                        
                        return `Para vivir exclusivamente de los intereses sin consumir capital, necesitarías acumular ${formatCurrency(capitalNecesario)}. Para alcanzar este monto en ${formData.edad_retiro - formData.edad_actual} años, deberías haber aportado aproximadamente ${formatCurrency(Math.max(0, aporteNecesario))} mensuales a tu inversión.`;
                      })()}
                    </p>
                  </div>
                )}
              </div>
              
              {/* La magia del interés compuesto */}
              <div className="p-4 bg-stone-50 rounded-lg border border-stone-200 mb-6 text-center">
                <p className="text-stone-700">
                  <span className="font-semibold">La magia del interés compuesto</span> transforma el tiempo en dinero. En {formData.edad_retiro - formData.edad_actual} años, has multiplicado tu inversión y generado {formatCurrency(resultados.ganancia_neta)} adicionales. Una rentabilidad del {((resultados.ganancia_neta / resultados.total_invertido) * 100).toFixed(2)}% sobre tu capital invertido, demostrando que la constancia y la paciencia son la clave de la libertad financiera.
                </p>
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