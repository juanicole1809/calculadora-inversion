'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Table, TableBody, TableCell, TableRow } from './ui/table'

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

export default function CalculadoraForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [resultados, setResultados] = useState<ResultadosInversion | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      capital_inicial: parseFloat(formData.get('capital_inicial') as string),
      inversion_mensual: parseFloat(formData.get('inversion_mensual') as string),
      tasa_anual: parseFloat(formData.get('tasa_anual') as string),
      inflacion_anual: parseFloat(formData.get('inflacion_anual') as string),
      total_anios: parseFloat(formData.get('total_anios') as string),
      costo_vida_mensual: parseFloat(formData.get('costo_vida_mensual') as string),
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
      setResultados(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al realizar el cálculo. Por favor, intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-stone-900 mb-4">Calculadora de Inversión</h1>
        <p className="text-lg text-stone-600">
          Planifica tu futuro financiero calculando el potencial de tus inversiones con interés compuesto
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ingresa tus datos</CardTitle>
          <CardDescription>
            Completa todos los campos para calcular tu inversión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="capital_inicial">Capital Inicial (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  <Input
                    id="capital_inicial"
                    name="capital_inicial"
                    type="number"
                    placeholder="Ej: 10000"
                    min="0"
                    step="0.01"
                    required
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inversion_mensual">Aporte Mensual (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                  <Input
                    id="inversion_mensual"
                    name="inversion_mensual"
                    type="number"
                    placeholder="Ej: 500"
                    min="0"
                    step="0.01"
                    required
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tasa_anual">Tasa de Interés Anual (TNA %)</Label>
                <div className="relative">
                  <Input
                    id="tasa_anual"
                    name="tasa_anual"
                    type="number"
                    placeholder="Ej: 6.25"
                    min="0"
                    step="0.01"
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
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
                    defaultValue="0"
                    required
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_anios">Cantidad de Años</Label>
                <Input
                  id="total_anios"
                  name="total_anios"
                  type="number"
                  placeholder="Ej: 5"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costo_vida_mensual">Costo de Vida Mensual (USD)</Label>
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
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Calculando...' : 'Calcular Inversión'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {resultados && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Resultados de la Inversión</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Capital Inicial:</TableCell>
                  <TableCell>{formatCurrency(resultados.capital_inicial)}</TableCell>
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
                <TableRow className="bg-stone-50">
                  <TableCell colSpan={2} className="text-center">
                    {resultados.mensaje_retiro}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 