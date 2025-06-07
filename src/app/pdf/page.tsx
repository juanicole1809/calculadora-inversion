"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Download,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Percent,
  PiggyBank,
  Clock,
  Target,
} from "lucide-react"
import { useEscenarios, type Escenario } from "@/context/escenarios-context"
import Link from "next/link"

function PDFEscenarioContent() {
  const searchParams = useSearchParams()
  const escenarioId = searchParams?.get('escenario')
  const { escenarios } = useEscenarios()
  const [escenario, setEscenario] = useState<Escenario | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (escenarioId && escenarios.length > 0) {
      const escenarioEncontrado = escenarios.find(e => e.id === escenarioId)
      setEscenario(escenarioEncontrado || null)
    }
  }, [escenarioId, escenarios])

  const formatearNumero = (numero: number) => {
    return new Intl.NumberFormat("es-ES", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(numero)
  }

  const formatearNumeroPreciso = (numero: number) => {
    return new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numero)
  }

  const generarSVGGraficoLineas = () => {
    if (!escenario?.crecimientoPorAnio) return ''
    
    const datos = escenario.crecimientoPorAnio.map((monto, index) => ({
      edad: escenario.edadActual + index,
      monto: monto
    }))
    
    const maxMonto = Math.max(...datos.map(d => d.monto))
    const minEdad = Math.min(...datos.map(d => d.edad))
    const maxEdad = Math.max(...datos.map(d => d.edad))
    
    const width = 600
    const height = 300
    const margin = { top: 20, right: 30, bottom: 60, left: 80 }
    
    const xScale = (edad: number) => margin.left + ((edad - minEdad) / (maxEdad - minEdad)) * (width - margin.left - margin.right)
    const yScale = (monto: number) => height - margin.bottom - (monto / maxMonto) * (height - margin.top - margin.bottom)
    
    const path = datos.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.edad)} ${yScale(d.monto)}`).join(' ')
    
    return `
      <svg width="${width}" height="${height}" style="border: 1px solid #e2e8f0; background: white;">
        <!-- Grid lines -->
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Axes -->
        <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#374151" stroke-width="2"/>
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#374151" stroke-width="2"/>
        
        <!-- Y-axis labels -->
        ${[0, 0.25, 0.5, 0.75, 1].map(t => {
          const value = maxMonto * t
          const y = yScale(value)
          return `
            <text x="${margin.left - 10}" y="${y + 5}" text-anchor="end" font-size="12" fill="#374151">
              $${formatearNumeroPreciso(value)}
            </text>
            <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="#374151" stroke-width="1"/>
          `
        }).join('')}
        
        <!-- X-axis labels -->
        ${datos.filter((_, i) => i % Math.ceil(datos.length / 8) === 0).map(d => {
          const x = xScale(d.edad)
          return `
            <text x="${x}" y="${height - margin.bottom + 20}" text-anchor="middle" font-size="12" fill="#374151">
              ${d.edad}
            </text>
            <line x1="${x}" y1="${height - margin.bottom}" x2="${x}" y2="${height - margin.bottom + 5}" stroke="#374151" stroke-width="1"/>
          `
        }).join('')}
        
        <!-- Data line -->
        <path d="${path}" fill="none" stroke="#3b82f6" stroke-width="3"/>
        
        <!-- Data points -->
        ${datos.filter((_, i) => i % Math.ceil(datos.length / 20) === 0).map(d => 
          `<circle cx="${xScale(d.edad)}" cy="${yScale(d.monto)}" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>`
        ).join('')}
        
        <!-- Labels -->
        <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="14" font-weight="bold" fill="#374151">Edad (años)</text>
        <text x="15" y="${height / 2}" text-anchor="middle" font-size="14" font-weight="bold" fill="#374151" transform="rotate(-90 15 ${height / 2})">Monto ($)</text>
        <text x="${width / 2}" y="15" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e40af">Evolución del Capital</text>
      </svg>
    `
  }

  const generarSVGGraficoCircular = () => {
    if (!escenario) return ''
    
    const montoFinal = escenario.resultado || 0
    const inversionTotal = escenario.montoInicial + (escenario.aportacionMensual * 12 * escenario.plazoAnios)
    const ganancias = montoFinal - inversionTotal
    
    const datos = [
      { name: 'Capital Inicial', value: escenario.montoInicial, color: '#3b82f6' },
      { name: 'Aportes Acumulados', value: escenario.aportacionMensual * 12 * escenario.plazoAnios, color: '#06b6d4' },
      { name: 'Ganancias por Rendimiento', value: ganancias, color: '#10b981' }
    ]
    
    const total = datos.reduce((sum, d) => sum + d.value, 0)
    const centerX = 200
    const centerY = 150
    const radius = 100
    
    let currentAngle = 0
    const paths = datos.map(d => {
      const percentage = d.value / total
      const angle = percentage * 2 * Math.PI
      const endAngle = currentAngle + angle
      
      const x1 = centerX + radius * Math.cos(currentAngle)
      const y1 = centerY + radius * Math.sin(currentAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)
      
      const largeArc = angle > Math.PI ? 1 : 0
      
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
      
      currentAngle = endAngle
      return { ...d, path, percentage }
    })
    
    return `
      <svg width="400" height="350" style="border: 1px solid #e2e8f0; background: white;">
        <!-- Pie chart -->
        ${paths.map(d => `<path d="${d.path}" fill="${d.color}"/>`).join('')}
        
        <!-- Legend -->
        ${paths.map((d, i) => `
          <rect x="20" y="${300 + i * 20}" width="15" height="15" fill="${d.color}"/>
          <text x="45" y="${312 + i * 20}" font-size="12" fill="#374151">
            ${d.name}: ${(d.percentage * 100).toFixed(1)}% ($${formatearNumeroPreciso(d.value)})
          </text>
        `).join('')}
        
        <!-- Title -->
        <text x="200" y="20" text-anchor="middle" font-size="16" font-weight="bold" fill="#1e40af">Composición del Monto Final</text>
      </svg>
    `
  }

  const generarPDF = async () => {
    if (!escenario) return

    setIsGenerating(true)
    
    try {
      // Crear el contenido HTML para el PDF
      const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Reporte de Plan de Retiro - ${escenario.nombre}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              color: #333; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #3b82f6; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 { 
              color: #1e40af; 
              margin: 0; 
              font-size: 32px; 
            }
            .header p { 
              color: #64748b; 
              margin: 10px 0; 
            }
            .summary { 
              background: #f8fafc; 
              padding: 25px; 
              border-radius: 10px; 
              margin: 30px 0; 
              border-left: 5px solid #3b82f6; 
            }
            .summary h2 { 
              color: #1e40af; 
              margin-top: 0; 
            }
            .summary .amount { 
              font-size: 48px; 
              font-weight: bold; 
              color: #059669; 
            }
            .grid { 
              display: grid; 
              grid-template-columns: repeat(2, 1fr); 
              gap: 20px; 
              margin: 30px 0; 
            }
            .card { 
              border: 1px solid #e2e8f0; 
              border-radius: 8px; 
              padding: 20px; 
              background: white; 
            }
            .card h3 { 
              margin-top: 0; 
              color: #374151; 
            }
            .card .value { 
              font-size: 24px; 
              font-weight: bold; 
              color: #1f2937; 
            }
            .table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 30px 0; 
            }
            .table th, .table td { 
              border: 1px solid #e2e8f0; 
              padding: 12px; 
              text-align: left; 
            }
            .table th { 
              background: #f1f5f9; 
              font-weight: bold; 
              color: #374151; 
            }
            .table tr:nth-child(even) { 
              background: #f8fafc; 
            }
            .text-right { 
              text-align: right; 
            }
            .text-green { 
              color: #059669; 
            }
            .text-blue { 
              color: #0284c7; 
            }
            .footer { 
              margin-top: 50px; 
              padding-top: 20px; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              color: #64748b; 
              font-size: 14px; 
            }
            .highlight-box {
              background: #ecfdf5;
              border: 1px solid #bbf7d0;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .highlight-box h3 {
              color: #047857;
              margin-top: 0;
            }
            .list {
              margin: 15px 0;
              padding-left: 20px;
            }
            .list li {
              margin: 8px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏦 MiRetiro - Plan de Inversión</h1>
            <p>Reporte detallado del escenario: <strong>${escenario.nombre}</strong></p>
            <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          <div class="summary">
            <h2>📊 Resumen Ejecutivo</h2>
            <div class="amount">$${formatearNumeroPreciso(escenario.resultado || 0)}</div>
            <p><strong>Monto final estimado a los ${escenario.edadRetiro} años</strong></p>
          </div>

          <div class="grid">
            <div class="card">
              <h3>💰 Capital Inicial</h3>
              <div class="value">$${formatearNumeroPreciso(escenario.montoInicial)}</div>
            </div>
            <div class="card">
              <h3>📅 Aporte Mensual</h3>
              <div class="value">$${formatearNumeroPreciso(escenario.aportacionMensual)}</div>
            </div>
            <div class="card">
              <h3>📈 Rendimiento Anual</h3>
              <div class="value">${escenario.tasaInteres}%</div>
            </div>
            <div class="card">
              <h3>📉 Inflación Anual</h3>
              <div class="value">${escenario.inflacion}%</div>
            </div>
          </div>

          <div class="highlight-box">
            <h3>🎯 Análisis del Plan</h3>
            <ul class="list">
              <li><strong>Tiempo de inversión:</strong> ${escenario.plazoAnios} años (${escenario.edadActual} a ${escenario.edadRetiro} años)</li>
              <li><strong>Inversión total:</strong> $${formatearNumeroPreciso(escenario.montoInicial + (escenario.aportacionMensual * 12 * escenario.plazoAnios))}</li>
              <li><strong>Ganancias netas:</strong> $${formatearNumeroPreciso((escenario.resultado || 0) - escenario.montoInicial - (escenario.aportacionMensual * 12 * escenario.plazoAnios))}</li>
              <li><strong>Rendimiento total:</strong> ${(((escenario.resultado || 0) / (escenario.montoInicial + (escenario.aportacionMensual * 12 * escenario.plazoAnios)) - 1) * 100).toFixed(1)}%</li>
              <li><strong>Ajuste por inflación:</strong> ${escenario.actualizarAportePorInflacion ? 'Activado' : 'Desactivado'}</li>
            </ul>
          </div>

          ${escenario.crecimientoPorAnio && escenario.crecimientoPorAnio.length > 0 ? `
          <h2>📈 Proyección año por año</h2>
          <p>Evolución del capital durante los primeros 10 años:</p>
          <table class="table">
            <thead>
              <tr>
                <th>Edad</th>
                <th class="text-right">Saldo Acumulado</th>
                <th class="text-right">Aportes del Año</th>
                <th class="text-right">Rendimiento del Año</th>
              </tr>
            </thead>
            <tbody>
              ${escenario.crecimientoPorAnio.slice(0, 11).map((monto, index) => {
                const edad = escenario.edadActual + index
                const aporteAnual = index === 0 ? escenario.montoInicial : escenario.aportacionMensual * 12
                const saldoAnterior = index === 0 ? 0 : escenario.crecimientoPorAnio![index - 1]
                const rendimientoAño = index === 0 ? 0 : monto - saldoAnterior - aporteAnual
                
                return `
                  <tr>
                    <td>${edad} años</td>
                    <td class="text-right">$${formatearNumeroPreciso(monto)}</td>
                    <td class="text-right text-blue">$${formatearNumeroPreciso(aporteAnual)}</td>
                    <td class="text-right text-green">$${formatearNumeroPreciso(rendimientoAño)}</td>
                  </tr>
                `
              }).join('')}
              ${escenario.crecimientoPorAnio.length > 11 ? `
              <tr>
                <td colspan="4" style="text-align: center; font-style: italic; color: #64748b;">
                  ... y ${escenario.crecimientoPorAnio.length - 11} años más hasta el retiro
                </td>
              </tr>
              ` : ''}
            </tbody>
          </table>
          ` : ''}

          <h2>📊 Gráficos de Proyección</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0;">
            <div style="text-align: center;">
              <h3 style="color: #1e40af; margin-bottom: 15px;">Evolución del Capital</h3>
              ${generarSVGGraficoLineas()}
            </div>
            
            <div style="text-align: center;">
              <h3 style="color: #1e40af; margin-bottom: 15px;">Composición Final</h3>
              ${generarSVGGraficoCircular()}
            </div>
          </div>

          <div class="highlight-box">
            <h3>💡 Consideraciones Importantes</h3>
            <ul class="list">
              <li>Este es un cálculo estimativo basado en los parámetros proporcionados</li>
              <li>Los rendimientos reales pueden variar debido a la volatilidad del mercado</li>
              <li>La inflación puede afectar el poder adquisitivo real de los montos</li>
              <li>Se recomienda revisar y ajustar el plan periódicamente</li>
              <li>Considera diversificar tus inversiones para reducir riesgos</li>
            </ul>
          </div>

          <div class="footer">
            <p><strong>MiRetiro</strong> - Calculadora de Plan de Retiro</p>
            <p>Este reporte es solo para fines informativos y no constituye asesoramiento financiero</p>
          </div>
        </body>
        </html>
      `

      // Crear un blob con el HTML
      const blob = new Blob([contenidoHTML], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a')
      link.href = url
      link.download = `Plan-Retiro-${escenario.nombre}-${new Date().toISOString().split('T')[0]}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Limpiar la URL del blob
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el reporte. Por favor, intenta nuevamente.')
    } finally {
      setIsGenerating(false)
    }
  }

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

  const inversionTotal = escenario.montoInicial + (escenario.aportacionMensual * 12 * escenario.plazoAnios)
  const gananciaNeta = (escenario.resultado || 0) - inversionTotal
  const rendimientoTotal = (gananciaNeta / inversionTotal) * 100

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center mb-4">
              <PiggyBank className="h-10 w-10 text-primary mr-2" />
              <h1 className="text-3xl font-bold text-slate-900">
                <span className="font-black">MiRetiro</span>
              </h1>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Generar Reporte PDF</h1>
            <p className="text-slate-600">
              Crea un reporte detallado del escenario: <span className="font-semibold">{escenario.nombre}</span>
            </p>
          </div>
          <Link href="/comparador">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al comparador
            </Button>
          </Link>
        </div>

        {/* Vista previa del reporte */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Vista Previa del Reporte
            </CardTitle>
            <CardDescription>
              Este será el contenido que se incluirá en tu reporte PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información básica */}
            <div className="bg-slate-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-4 h-4 rounded-full ${escenario.color}`}></div>
                <h3 className="text-xl font-bold">{escenario.nombre}</h3>
              </div>
              
              <div className="text-center mb-6 p-4 bg-white rounded-lg border-2 border-green-200">
                <div className="text-sm text-slate-500 mb-2">Monto Final Estimado</div>
                <div className="text-4xl font-bold text-green-600">${formatearNumeroPreciso(escenario.resultado || 0)}</div>
                <div className="text-sm text-slate-500 mt-2">
                  A los {escenario.edadRetiro} años ({escenario.plazoAnios} años de inversión)
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-blue-600">Capital Inicial</div>
                  <div className="font-bold text-blue-900">${formatearNumero(escenario.montoInicial)}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <Calendar className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <div className="text-xs text-green-600">Aporte Mensual</div>
                  <div className="font-bold text-green-900">${formatearNumero(escenario.aportacionMensual)}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <div className="text-xs text-purple-600">Rendimiento</div>
                  <div className="font-bold text-purple-900">{escenario.tasaInteres}%</div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded">
                  <Percent className="h-6 w-6 text-amber-600 mx-auto mb-1" />
                  <div className="text-xs text-amber-600">Inflación</div>
                  <div className="font-bold text-amber-900">{escenario.inflacion}%</div>
                </div>
              </div>
            </div>

            {/* Análisis financiero */}
            <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
              <h4 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análisis Financiero
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-emerald-600 font-medium">Inversión Total</div>
                  <div className="text-xl font-bold text-emerald-800">${formatearNumeroPreciso(inversionTotal)}</div>
                </div>
                <div>
                  <div className="text-emerald-600 font-medium">Ganancia Neta</div>
                  <div className="text-xl font-bold text-emerald-800">${formatearNumeroPreciso(gananciaNeta)}</div>
                </div>
                <div>
                  <div className="text-emerald-600 font-medium">Rendimiento Total</div>
                  <div className="text-xl font-bold text-emerald-800">{rendimientoTotal.toFixed(1)}%</div>
                </div>
              </div>
            </div>

            {/* Información adicional que incluirá el PDF */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                El reporte incluirá:
              </h4>
              <ul className="space-y-2 text-sm text-blue-700">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Resumen ejecutivo con monto final estimado
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Parámetros detallados del escenario de inversión
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Análisis financiero completo (inversión, ganancias, rendimiento)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Tabla de proyección año por año (primeros 10 años)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Gráficos de evolución del capital y composición final
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Consideraciones importantes y recomendaciones
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Formato HTML optimizado para impresión
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Botón para generar PDF */}
        <div className="text-center">
          <Button 
            onClick={generarPDF}
            disabled={isGenerating}
            size="lg"
            className="gap-2 px-8 py-4 text-lg"
          >
            {isGenerating ? (
              <>
                <Clock className="h-5 w-5 animate-spin" />
                Generando reporte...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generar Reporte (HTML)
              </>
            )}
          </Button>
          <p className="text-sm text-slate-500 mt-4">
            Se descargará un archivo HTML que puedes abrir en tu navegador e imprimir como PDF
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PDFEscenario() {
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
      <PDFEscenarioContent />
    </Suspense>
  )
} 