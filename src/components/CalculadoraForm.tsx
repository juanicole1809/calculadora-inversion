'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { InfoIcon, XIcon, RefreshCw } from 'lucide-react'

interface ResultadosInversion {
  capital_inicial: number
  inversion_mensual: number
  total_aportes_mensuales: number
  total_invertido: number
  monto_total: number
  ganancia_neta: number
  anios_retiro: number | string
  mensaje_retiro: string
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
    rendimiento_anual: 0,
    inflacion_anual: 3 // Valor por defecto
  })
  const [activeTab, setActiveTab] = useState('datos-personales')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [activeInfoBox, setActiveInfoBox] = useState<string | null>(null)

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
        setActiveTab('datos-personales')
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
        // Extraer los valores de intereses mensuales y retiros mensuales del mensaje original
        const mensajeOriginal = result.mensaje_retiro;
        // Buscar los valores numéricos en el mensaje
        const interesesMatch = mensajeOriginal.match(/\$(\d+(\.\d+)?)/);
        const retirosMatch = mensajeOriginal.match(/\$(\d+(\.\d+)?)\)/);
        
        if (interesesMatch && retirosMatch) {
          const interesesMensuales = parseFloat(interesesMatch[1]);
          const retirosMensuales = parseFloat(retirosMatch[1]);
          
          result.mensaje_retiro = `¡Excelente noticia! Tu capital no se agotará nunca, ya que el dinero que recibirás mensualmente producto de los intereses (${formatCurrency(interesesMensuales)}) será mayor que lo que necesitas retirar para cubrir tus gastos según el costo de vida indicado (${formatCurrency(retirosMensuales)}).`;
        }
      }
      
      setResultados(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al realizar el cálculo. Por favor, intente nuevamente.')
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
    }).format(number)
  }

  const formatYears = (years: number | string) => {
    return typeof years === 'string' ? years : 
      new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }).format(years) + ' años'
  }

  const handleNextTab = () => {
    // Validar datos personales antes de avanzar
    const errors = validatePersonalData()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setActiveTab('datos-inversion')
  }

  const handlePrevTab = () => {
    setActiveTab('datos-personales')
  }

  const handleReset = () => {
    setFormData(prev => ({
      ...prev,
      capital_inicial: 0,
      inversion_mensual: 0,
      rendimiento_anual: 0
      // Mantenemos los datos personales y la inflación
    }))
    setValidationErrors({})
    setResultados(null)
    setActiveTab('datos-inversion')
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-4">Calculadora de Retiro</h1>
        <p className="text-lg text-stone-600">
          Planifica tu futuro financiero calculando el potencial de tus ahorros para un retiro cómodo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresa tus datos</CardTitle>
          <CardDescription>
            Completa todos los campos para calcular tu plan de retiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="datos-personales">Datos Personales</TabsTrigger>
                <TabsTrigger value="datos-inversion">Datos de Inversión</TabsTrigger>
              </TabsList>
              
              <TabsContent value="datos-personales" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edad_actual">Edad Actual</Label>
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
                    <Label htmlFor="edad_retiro">Edad de Retiro</Label>
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
                      <Label htmlFor="costo_vida_mensual">Costo de Vida Mensual al Retirarse (USD)</Label>
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
                
                <Button type="button" onClick={handleNextTab} className="w-full">
                  Siguiente
                </Button>
              </TabsContent>
              
              <TabsContent value="datos-inversion" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="capital_inicial">Capital Inicial (USD)</Label>
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
                      <Label htmlFor="inversion_mensual">Aporte Mensual (USD)</Label>
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
                    <Label htmlFor="rendimiento_anual">Rendimiento de la Inversión (TNA %)</Label>
                    <div className="relative">
                      <Input
                        id="rendimiento_anual"
                        name="rendimiento_anual"
                        type="number"
                        placeholder="Ej: 6.25"
                        min="0"
                        step="0.01"
                        required
                        className={`pr-8 ${validationErrors.rendimiento_anual ? "border-red-500" : ""}`}
                        value={formData.rendimiento_anual || ''}
                        onChange={handleChange}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                      {validationErrors.rendimiento_anual && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.rendimiento_anual}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="inflacion_anual">Inflación Anual Esperada (%)</Label>
                    <div className="relative">
                      <Input
                        id="inflacion_anual"
                        name="inflacion_anual"
                        type="number"
                        placeholder="Ej: 3"
                        min="0"
                        step="0.01"
                        required
                        className="pr-8"
                        value={formData.inflacion_anual}
                        onChange={handleChange}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button type="button" onClick={handlePrevTab} className="w-1/2" variant="outline">
                    Anterior
                  </Button>
                  <Button type="submit" className="w-1/2" disabled={isLoading}>
                    {isLoading ? 'Calculando...' : 'Ver Resultados'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
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
          
          <Card className="mt-2">
            <CardHeader>
              <CardTitle>Resumen Proyectado de tu Plan de Retiro</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <TableRow className="bg-stone-50">
                    <TableCell className="font-medium">Total Invertido:</TableCell>
                    <TableCell>{formatCurrency(resultados.total_invertido)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-green-50">
                    <TableCell className="font-medium">Monto Final:</TableCell>
                    <TableCell>{formatCurrency(resultados.monto_total)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-blue-50">
                    <TableCell className="font-medium">Ganancia Neta:</TableCell>
                    <TableCell>{formatCurrency(resultados.ganancia_neta)}</TableCell>
                  </TableRow>
                  <TableRow className="bg-yellow-50">
                    <TableCell className="font-medium">Años de Retiro Posibles:</TableCell>
                    <TableCell>{formatYears(resultados.anios_retiro)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              {/* Mensaje de retiro separado de la tabla para mejor formato */}
              <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-100">
                <p className="text-center text-stone-700">
                  {resultados.mensaje_retiro}
                </p>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-center text-stone-700">
                  <span className="font-semibold">La magia del interés compuesto:</span> Gracias a haber invertido tu dinero durante {formData.edad_retiro - formData.edad_actual} años, has obtenido {formatCurrency(resultados.ganancia_neta)} adicionales a tu inversión inicial. 
                  Esto representa un {((resultados.ganancia_neta / resultados.total_invertido) * 100).toFixed(2)}% de rendimiento sobre el capital total invertido.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 