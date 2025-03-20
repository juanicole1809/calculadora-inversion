'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { InfoIcon, XIcon, ArrowRight, ArrowLeft, Calculator } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from "date-fns"

interface FormProps {
  formData: {
    edad_actual: number
    fecha_nacimiento: Date
    edad_retiro: number
    costo_vida_mensual: number
    capital_inicial: number
    inversion_mensual: number
    rendimiento_anual: number | string
    inflacion_anual: number | string
  }
  textoFecha: string
  formStep: number
  validationErrors: Record<string, string>
  activeInfoBox: string | null
  inflacionPersonalizada: boolean
  rendimientoPersonalizado: boolean
  isLoading: boolean
  userName: string | null
  setTextoFecha: (texto: string) => void
  setFormData: (data: any) => void
  setValidationErrors: (errors: any) => void
  setActiveInfoBox: (box: string | null) => void
  setInflacionPersonalizada: (value: boolean) => void
  setRendimientoPersonalizado: (value: boolean) => void
  handleDateChange: (date: Date | undefined) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  handleNextStep: () => void
  handlePrevStep: () => void
  capitalizeName: (name: string) => string
}

export default function FormularioCalculadora({
  formData,
  textoFecha,
  formStep,
  validationErrors,
  activeInfoBox,
  inflacionPersonalizada,
  rendimientoPersonalizado,
  isLoading,
  userName,
  setTextoFecha,
  setFormData,
  setValidationErrors,
  setActiveInfoBox,
  setInflacionPersonalizada,
  setRendimientoPersonalizado,
  handleDateChange,
  handleChange,
  handleSubmit,
  handleNextStep,
  handlePrevStep,
  capitalizeName
}: FormProps) {
  return (
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
                        placeholder="DD/MM/AAAA (Ej: 15/06/1985)"
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
  )
} 