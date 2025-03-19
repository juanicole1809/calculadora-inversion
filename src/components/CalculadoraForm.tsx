'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { InfoIcon, XIcon, RefreshCw, ArrowRight, ArrowLeft, Calculator, FileText, Printer } from 'lucide-react'
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
  fecha_nacimiento: Date
  edad_retiro: number
  costo_vida_mensual: number
  // Datos de inversión
  capital_inicial: number
  inversion_mensual: number
  rendimiento_anual: number | string
  inflacion_anual: number | string
}

export default function CalculadoraForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [resultados, setResultados] = useState<ResultadosInversion | null>(null)
  const [formData, setFormData] = useState<FormData>({
    edad_actual: 0,
    fecha_nacimiento: new Date(''), // Fecha inválida que se mostrará como vacía
    edad_retiro: 0,
    costo_vida_mensual: 0,
    capital_inicial: 0,
    inversion_mensual: 0,
    rendimiento_anual: 6, // Valor por defecto actualizado a 6%
    inflacion_anual: 3.5
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
    console.log('Función exportarPDF iniciada');
    
    if (!resultados) {
      console.error('No hay resultados para exportar a PDF');
      alert('Error: No hay datos para exportar a PDF');
      return;
    }
    
    setIsExportingPDF(true);
    
    try {
      console.log('Intentando generar PDF con método simplificado primero...');
      
      // Intentar primero con el método simplificado (más confiable)
      const simpleSuccess = createSimplePDF(resultados, formData, uiValues);
      
      if (simpleSuccess) {
        console.log('PDF generado exitosamente con método simplificado');
        alert('¡PDF generado exitosamente! Revisa tus descargas.');
      } else {
        console.log('Método simplificado falló, intentando con método html2canvas...');
        
        // Si falló, intentar con html2canvas
        if (resultadosRef.current) {
          const htmlSuccess = await exportToPDF(
            resultadosRef.current as HTMLElement, 
            `Plan_Retiro_${format(new Date(), 'dd-MM-yyyy')}.pdf`
          );
          
          if (htmlSuccess) {
            console.log('PDF generado exitosamente con método html2canvas');
            alert('¡PDF generado exitosamente! Revisa tus descargas.');
          } else {
            throw new Error('Ambos métodos de generación de PDF fallaron');
          }
        } else {
          throw new Error('No se pudo encontrar el elemento para exportar a PDF');
        }
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, intenta nuevamente. Revisa la consola para más detalles.');
    } finally {
      setIsExportingPDF(false);
      console.log('Estado isExportingPDF cambiado a false');
    }
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
          <CardTitle>
            {userName ? 
              `${capitalizeName(userName)}, ingresa tus datos` :
              `Ingresa tus datos`}
          </CardTitle>
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
                      <Label htmlFor="fecha_nacimiento">Tu Fecha de Nacimiento</Label>
                      <div className="relative">
                        <Input
                          id="fecha_nacimiento"
                          name="fecha_nacimiento"
                          type="text"
                          placeholder="Ingresa en formato DD/MM/AAAA (ejemplo: 15/06/1985)"
                          className={`${validationErrors.fecha_nacimiento ? "border-red-500" : ""}`}
                          value={textoFecha}
                          onChange={(e) => {
                            // Obtenemos el valor actual del campo
                            let textoIngresado = e.target.value;
                            
                            // Eliminamos cualquier caracter que no sea dígito o barra
                            textoIngresado = textoIngresado.replace(/[^\d\/]/g, '');
                            
                            // Limitamos a un máximo de 10 caracteres (DD/MM/AAAA)
                            textoIngresado = textoIngresado.slice(0, 10);
                            
                            // Agregamos automáticamente las barras
                            if (textoIngresado.length === 2 && !textoIngresado.includes('/') && textoFecha.length < 2) {
                              textoIngresado += '/';
                            } else if (textoIngresado.length === 5 && textoIngresado.charAt(2) === '/' && !textoIngresado.includes('/', 3) && textoFecha.length < 5) {
                              textoIngresado += '/';
                            }
                            
                            // Actualizamos el estado del texto de fecha
                            setTextoFecha(textoIngresado);
                            
                            // Si el texto corresponde a una fecha completa en formato DD/MM/AAAA, validamos y actualizamos
                            if (textoIngresado.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                              const [dia, mes, anio] = textoIngresado.split('/').map(Number);
                              const fechaCandidata = new Date(anio, mes - 1, dia);
                              
                              // Verificar si es una fecha válida
                              if (
                                !isNaN(fechaCandidata.getTime()) &&
                                fechaCandidata.getDate() === dia &&
                                fechaCandidata.getMonth() === mes - 1 &&
                                fechaCandidata.getFullYear() === anio
                              ) {
                                handleDateChange(fechaCandidata);
                              }
                            } else if (textoIngresado === '') {
                              // Si el campo está vacío, limpiamos el estado
                              setFormData(prev => ({
                                ...prev,
                                fecha_nacimiento: new Date(''),
                                edad_actual: 0
                              }));
                            }
                          }}
                        />
                        {validationErrors.fecha_nacimiento && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.fecha_nacimiento}</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {formData.edad_actual > 0 
                          ? `Edad actual calculada: ${formData.edad_actual} años` 
                          : 'Escribe tu fecha en formato DD/MM/AAAA (ejemplo: 15/06/1985)'}
                      </p>
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
                            formData.rendimiento_anual === 0 ? "colchon" :
                            formData.rendimiento_anual === 3 ? "conservadora" :
                            formData.rendimiento_anual === 6 ? "moderada" :
                            formData.rendimiento_anual === 9 ? "arriesgada" :
                            "otro"
                          }
                          onValueChange={(value) => {
                            if (value === "colchon") {
                              setRendimientoPersonalizado(false);
                              setFormData(prev => ({ ...prev, rendimiento_anual: 0 }));
                            } else if (value === "conservadora") {
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
                            <SelectItem value="colchon">Debajo del colchón (0%)</SelectItem>
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
                              value={formData.rendimiento_anual === 0 ? '' : formData.rendimiento_anual}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  rendimiento_anual: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                }))
                                // Limpiar error de validación cuando el usuario modifica el campo
                                if (validationErrors.rendimiento_anual) {
                                  setValidationErrors(prev => {
                                    const newErrors = { ...prev }
                                    delete newErrors.rendimiento_anual
                                    return newErrors
                                  })
                                }
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
                            formData.inflacion_anual === 0 ? "sin_inflacion" :
                            formData.inflacion_anual === 1.5 ? "baja" :
                            formData.inflacion_anual === 3.5 ? "moderada" :
                            formData.inflacion_anual === 6 ? "alta" :
                            "otro"
                          }
                          onValueChange={(value) => {
                            if (value === "sin_inflacion") {
                              setInflacionPersonalizada(false);
                              setFormData(prev => ({ ...prev, inflacion_anual: 0 }));
                            } else if (value === "baja") {
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
                            <SelectItem value="sin_inflacion">Sin inflación (0%)</SelectItem>
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
                              value={formData.inflacion_anual === 0 ? '' : formData.inflacion_anual}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  inflacion_anual: e.target.value === '' ? '' : parseFloat(e.target.value) || 0
                                }))
                                // Limpiar error de validación
                                if (validationErrors.inflacion_anual) {
                                  setValidationErrors(prev => {
                                    const newErrors = { ...prev }
                                    delete newErrors.inflacion_anual
                                    return newErrors
                                  })
                                }
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
          <div className="flex justify-center mt-6 mb-4 gap-4">
            <Button 
              type="button" 
              onClick={handleReset} 
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300 hover:border-blue-400 font-medium px-8 py-3 text-base flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Resetear valores de inversión
            </Button>
            
            <Button 
              type="button" 
              onClick={exportarPDF} 
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300 hover:border-red-400 font-medium px-8 py-3 text-base flex items-center gap-2"
              disabled={isExportingPDF}
            >
              <FileText className="h-5 w-5" />
              {isExportingPDF ? 'Generando PDF...' : 'Descargar como PDF'}
            </Button>
          </div>
          
          <Card className="mt-2" id="resultados-section" ref={resultadosRef}>
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                Resumen Proyectado de tu Plan de Retiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Detalles de la inversión (primero) */}
              <div className="mb-6">
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
              
              {/* Distribución de tu capital (proporción de capital invertido vs ganancia) */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-stone-600 mb-2">DISTRIBUCIÓN DE TU CAPITAL</h3>
                <div className="bg-stone-50 rounded-lg p-4 border border-stone-200">
                  {(() => {
                    const proporcionCapital = (resultados.total_invertido / resultados.monto_total) * 100;
                    const proporcionGanancia = (resultados.ganancia_neta / resultados.monto_total) * 100;
                    
                    return (
                      <>
                        <div className="w-full h-6 bg-stone-200 rounded-full overflow-hidden mb-3">
                          <div className="flex h-full">
                            <div 
                              className="h-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                              style={{ width: `${proporcionCapital}%` }}
                            >
                              {proporcionCapital >= 15 ? `${proporcionCapital.toFixed(0)}%` : ''}
                            </div>
                            <div 
                              className="h-full bg-green-500 flex items-center justify-center text-xs text-white font-medium"
                              style={{ width: `${proporcionGanancia}%` }}
                            >
                              {proporcionGanancia >= 15 ? `${proporcionGanancia.toFixed(0)}%` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-stone-600">Capital invertido: {formatCurrency(resultados.total_invertido)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-stone-600">Ganancia: {formatCurrency(resultados.ganancia_neta)}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Intereses mensuales vs Costo de vida */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
              
              {/* Proyección año a año (colapsable) */}
              <div className="mb-6">
                <Button 
                  type="button"
                  onClick={() => setProyeccionAbierta(!proyeccionAbierta)}
                  variant="outline"
                  className="w-full mb-3 flex justify-between items-center py-2 border-stone-200 bg-stone-50"
                >
                  <span className="font-medium text-stone-800">Proyección de Crecimiento</span>
                  <span className={`transition-transform duration-200 ${proyeccionAbierta ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </Button>
                
                {proyeccionAbierta && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
                      {(() => {
                        // Generar proyección año a año
                        const anios = Math.min(10, formData.edad_retiro - formData.edad_actual);
                        const proyeccion = [];
                        
                        let monto = formData.capital_inicial;
                        const rendimientoMensual = uiValues.rendimientoAnual / 100 / 12;
                        
                        for (let i = 1; i <= anios; i++) {
                          // Calcular el monto para este año
                          for (let m = 1; m <= 12; m++) {
                            monto = (monto + formData.inversion_mensual) * (1 + rendimientoMensual);
                          }
                          
                          proyeccion.push({
                            anio: i,
                            monto: monto,
                            aportado: formData.capital_inicial + (formData.inversion_mensual * i * 12),
                            ganancia: monto - (formData.capital_inicial + (formData.inversion_mensual * i * 12))
                          });
                        }
                        
                        return (
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-full">
                              <thead>
                                <tr className="border-b border-stone-200">
                                  <th className="text-left p-2 text-stone-600">Año</th>
                                  <th className="text-right p-2 text-stone-600">Capital Acumulado</th>
                                  <th className="text-right p-2 text-stone-600">Total Aportado</th>
                                  <th className="text-right p-2 text-stone-600">Ganancia</th>
                                </tr>
                              </thead>
                              <tbody>
                                {proyeccion.map(item => (
                                  <tr key={item.anio} className="border-b border-stone-100">
                                    <td className="p-2 text-stone-800">{item.anio}</td>
                                    <td className="p-2 text-right text-stone-800 font-medium">{formatCurrency(item.monto)}</td>
                                    <td className="p-2 text-right text-stone-600">{formatCurrency(item.aportado)}</td>
                                    <td className="p-2 text-right text-green-600">+{formatCurrency(item.ganancia)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <p className="text-sm text-stone-500 mt-3">
                              Tabla mostrando la proyección de los primeros {anios} años. El monto total a la edad de retiro ({formData.edad_retiro} años) será de {formatCurrency(resultados.monto_total)}.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                )}
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
                  const factorCapitalizacion = tasaMensual === 0 ?
                    mesesHastaRetiro : ((Math.pow(1 + tasaMensual, mesesHastaRetiro) - 1) / tasaMensual);
                  const aporteNecesarioMensual = Math.max(0, capitalNecesario / factorCapitalizacion - (formData.capital_inicial * Math.pow(1 + tasaMensual, mesesHastaRetiro)) / factorCapitalizacion);
                  const aporteAdicionalMensual = Math.max(0, aporteNecesarioMensual - formData.inversion_mensual);
                  
                  // Calcular cuánto tiempo tomará llegar ahí (después de la edad de retiro)
                  let meses = 0;
                  let monto = resultados.monto_total;
                  const rendimientoMensual = uiValues.rendimientoAnual / 100 / 12;
                  
                  // Si el rendimiento es 0%, el bucle sería infinito
                  if (uiValues.rendimientoAnual === 0) {
                    meses = 1200; // Máximo de años (no se alcanzará la independencia financiera)
                  } else {
                    while (monto < capitalNecesario && meses < 1200) { // máximo 100 años
                      monto = (monto + formData.inversion_mensual) * (1 + rendimientoMensual);
                      meses++;
                    }
                  }
                  
                  const anios = Math.floor(meses / 12);
                  const mesesRestantes = meses % 12;
                  
                  // Calcular la edad futura correctamente formateada
                  const edadFutura = formData.edad_retiro + anios;
                  const edadFormateada = mesesRestantes > 0 
                    ? `${edadFutura} años y ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`
                    : `${edadFutura} años`;
                  
                  // Si no se logrará con los aportes actuales
                  if (meses >= 1200) {
                    return (
                      <div className="text-center">
                        <p className="text-amber-600 mb-2">
                          {userName ? `${capitalizeName(userName)}, con tus aportes actuales` : 'Con tus aportes actuales'}, no lograrás la independencia financiera incluso después de tu edad de retiro.
                        </p>
                        <p className="text-stone-700">
                          Necesitarás un capital de {formatCurrency(capitalNecesario)} para cubrir tus gastos solo con intereses.
                          Al llegar a la edad de retiro, te faltarán {formatCurrency(capitalFaltante)}.
                        </p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                          <p className="text-stone-800 font-medium mb-2">¿Quieres lograr independencia financiera a los {formData.edad_retiro} años?</p>
                          <p className="text-stone-700">
                            Necesitarías aportar <strong>{formatCurrency(aporteNecesarioMensual)}</strong> mensuales desde ahora hasta tu retiro.
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
                      <div className="bg-stone-100 p-4 rounded-lg mb-4">
                        <h4 className="text-stone-800 font-medium mb-2">¿Qué significa "independencia financiera"?</h4>
                        <p className="text-stone-700 mb-2">
                          La independencia financiera se alcanza cuando tus inversiones generan suficientes intereses
                          para cubrir todos tus gastos mensuales, sin necesidad de seguir trabajando o aportar más dinero.
                        </p>
                      </div>
                      <p className="text-stone-700 mb-3">
                        <strong>Al llegar a tu edad de retiro ({formData.edad_retiro} años):</strong> Los intereses proyectados que generará tu capital 
                        ({formatCurrency(interesesMensuales)} mensuales) no serán suficientes para cubrir tus gastos estimados 
                        ({formatCurrency(resultados.costo_vida_actualizado)} mensuales).
                      </p>
                      <p className="text-stone-700 mb-3">
                        <strong>¿Qué necesitarás para lograr independencia financiera?</strong> Un capital total de <strong>{formatCurrency(capitalNecesario)}</strong> para generar suficientes intereses.
                        Al momento de tu retiro, te faltarán <strong>{formatCurrency(capitalFaltante)}</strong>.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-stone-800 font-medium mb-2">¿Quieres lograr independencia financiera a los {formData.edad_retiro} años?</p>
                        <p className="text-stone-700">
                          Necesitarías aportar <strong>{formatCurrency(aporteNecesarioMensual)}</strong> mensuales desde ahora hasta tu retiro.
                        </p>
                        <p className="text-blue-600 font-medium mt-2">
                          Eso significa <strong>{formatCurrency(aporteAdicionalMensual)}</strong> adicionales a tu aporte actual de {formatCurrency(formData.inversion_mensual)}.
                        </p>
                      </div>
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
                    <span className="font-medium text-stone-800 text-left">¿Qué significa que puedo vivir de los intereses?</span>
                    <span className={`transition-transform duration-200 ${activeInfoBox === 'pregunta1' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta1' && (
                    <div className="p-4 bg-white">
                      <p className="text-stone-700 mb-2">
                        {userName ? `${capitalizeName(userName)}, vivir de los intereses` : 'Vivir de los intereses'} significa que el dinero que genera tu capital invertido cada mes (los intereses) 
                        es suficiente para cubrir todos tus gastos mensuales, sin necesidad de tocar el capital principal.
                      </p>
                      <p className="text-stone-700">
                        En tu caso, necesitas generar <strong>{formatCurrency(resultados.costo_vida_actualizado)}</strong> mensuales para mantener 
                        tu nivel de vida. {uiValues.rendimientoAnual === 0 
                          ? "Con un rendimiento anual del 0%, no es posible generar intereses para cubrir tus gastos."
                          : `Con un rendimiento anual del ${uiValues.rendimientoAnual}%, necesitas un capital de 
                            <strong> ${formatCurrency((resultados.costo_vida_actualizado * 12) / (uiValues.rendimientoAnual / 100))}</strong> para generar esos intereses mensualmente.`
                        }
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
                    <span className="font-medium text-stone-800 text-left">¿Cuál es la diferencia entre mi monto invertido y mi ganancia?</span>
                    <span className={`transition-transform duration-200 ${activeInfoBox === 'pregunta2' ? 'rotate-180' : ''}`}>
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
                    <span className="font-medium text-stone-800 text-left">¿Qué significa la duración de mi capital?</span>
                    <span className={`transition-transform duration-200 ${activeInfoBox === 'pregunta3' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta3' && (
                    <div className="p-4 bg-white">
                      {resultados.anios_retiro === "∞" ? (
                        <p className="text-stone-700">
                          {uiValues.rendimientoAnual === 0 ? 
                            "Con un rendimiento del 0%, tu capital no generará intereses para cubrir tus gastos, por lo que eventualmente se agotará a menos que tus gastos sean cero." :
                            `En tu caso, ¡buenas noticias! Los intereses que generará tu capital (<strong>${formatCurrency(resultados.monto_total * uiValues.rendimientoAnual / 100 / 12)}</strong> mensuales) 
                            superan tus gastos mensuales (<strong>${formatCurrency(resultados.costo_vida_actualizado)}</strong>), 
                            por lo que tu capital nunca se agotará. De hecho, seguirá creciendo incluso durante tu retiro, permitiéndote aumentar 
                            tu nivel de vida o dejar una herencia.`
                          }
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
                              ` son mayores que los intereses que genera tu capital (<strong>${formatCurrency(resultados.monto_total * uiValues.rendimientoAnual / 100 / 12)}</strong> mensuales), 
                              por lo que cada mes consumirás una parte de tu capital principal hasta agotarlo.`
                            }
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
                    <span className="font-medium text-stone-800 text-left">¿Qué debo cambiar para mejorar mi plan de retiro?</span>
                    <span className={`transition-transform duration-200 ${activeInfoBox === 'pregunta4' ? 'rotate-180' : ''}`}>
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
                        const factorCapitalizado = tasaMensual === 0 ? 
                          mesesRestantes : ((Math.pow(1 + tasaMensual, mesesRestantes) - 1) / tasaMensual);
                        
                        // La fórmula para calcular el aporte mensual necesario
                        const aporteOptimoMensual = capitalFaltante / factorCapitalizado;
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
                
                {/* Pregunta 5: Conceptos básicos del interés compuesto */}
                <div className="mb-3 border border-stone-200 rounded-lg overflow-hidden">
                  <Button 
                    type="button"
                    onClick={() => setActiveInfoBox(activeInfoBox === 'pregunta5' ? null : 'pregunta5')}
                    variant="ghost"
                    className="w-full p-4 flex justify-between items-center bg-stone-50 hover:bg-stone-100"
                  >
                    <span className="font-medium text-stone-800 text-left">¿Por qué el interés compuesto es tan poderoso?</span>
                    <span className={`transition-transform duration-200 ${activeInfoBox === 'pregunta5' ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </Button>
                  
                  {activeInfoBox === 'pregunta5' && (
                    <div className="p-4 bg-white">
                      <p className="text-stone-700 mb-3">
                        El interés compuesto es poderoso porque genera "interés sobre el interés", creando un efecto de bola de nieve 
                        que acelera el crecimiento de tu dinero con el tiempo.
                      </p>
                      <p className="text-stone-700 mb-3">
                        En tu caso, el interés compuesto ha transformado una inversión total de <strong>{formatCurrency(resultados.total_invertido)}</strong> en {' '}
                        <strong>{formatCurrency(resultados.monto_total)}</strong>, generando una ganancia de <strong>{formatCurrency(resultados.ganancia_neta)}</strong> {' '}
                        que representa un <strong>{((resultados.ganancia_neta / resultados.total_invertido) * 100).toFixed(0)}%</strong> sobre lo que invertiste.
                      </p>
                      <p className="text-stone-700">
                        La proyección de crecimiento muestra cómo este efecto se acelera con el tiempo: en los primeros años el crecimiento es moderado, 
                        pero en los últimos años se vuelve exponencial, generando mucho más dinero en menos tiempo.
                      </p>
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