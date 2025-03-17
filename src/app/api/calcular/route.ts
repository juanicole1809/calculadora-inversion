import { NextResponse } from 'next/server'

function calcularInversion(
  capital_inicial: number,
  inversion_mensual: number,
  tasa_anual: number,
  total_anios: number,
  costo_vida_mensual: number,
  inflacion_anual: number
) {
  // Convertir años a meses
  const total_meses = Math.floor(total_anios * 12)
  
  // Convertir tasas anuales a mensual
  const tasa_mensual = tasa_anual / 100 / 12
  const inflacion_mensual = inflacion_anual / 100 / 12
  
  // Cálculo del monto acumulado durante la fase de inversión
  let monto_total = capital_inicial
  for (let i = 0; i < total_meses; i++) {
    monto_total = (monto_total + inversion_mensual) * (1 + tasa_mensual)
  }
  
  // Cálculo de totales de la fase de inversión
  const total_aportes_mensuales = inversion_mensual * total_meses
  const total_invertido = capital_inicial + total_aportes_mensuales
  const ganancia_neta = monto_total - total_invertido
  
  // Actualizamos el costo de vida mensual con la inflación acumulada durante el periodo de inversión
  const factor_inflacion = Math.pow(1 + (inflacion_anual / 100), total_anios)
  const costo_vida_mensual_actualizado = costo_vida_mensual * factor_inflacion
  
  // Verificar si el capital nunca se agotará
  const interes_mensual_inicial = monto_total * tasa_mensual
  const retiro_mensual_inicial = costo_vida_mensual_actualizado
  
  if (interes_mensual_inicial > retiro_mensual_inicial) {
    return {
      capital_inicial,
      inversion_mensual,
      total_aportes_mensuales,
      total_invertido,
      monto_total,
      ganancia_neta,
      costo_vida_inicial: costo_vida_mensual,
      costo_vida_actualizado: costo_vida_mensual_actualizado,
      anios_retiro: "∞",
      mensaje_retiro: `El capital no se agotará: los intereses mensuales ($${interes_mensual_inicial.toFixed(2)}) son mayores que los retiros mensuales actualizados por inflación ($${retiro_mensual_inicial.toFixed(2)})`
    }
  }
  
  // Cálculo de años de retiro considerando inflación
  let meses_retiro = 0
  let monto_restante = monto_total
  let retiro_mensual_actual = costo_vida_mensual_actualizado
  const MAX_MESES = 1200 // Límite de 100 años
  
  while (monto_restante > retiro_mensual_actual && meses_retiro < MAX_MESES) {
    // Retiramos el costo de vida mensual ajustado por inflación
    monto_restante -= retiro_mensual_actual
    
    // Aplicamos el interés mensual al monto restante
    if (monto_restante > 0) {
      monto_restante *= (1 + tasa_mensual)
    }
    
    // Actualizamos el retiro mensual por inflación
    retiro_mensual_actual *= (1 + inflacion_mensual)
    meses_retiro++
  }
  
  const anios_retiro = Math.round(meses_retiro / 12 * 10) / 10

  return {
    capital_inicial,
    inversion_mensual,
    total_aportes_mensuales,
    total_invertido,
    monto_total,
    ganancia_neta,
    costo_vida_inicial: costo_vida_mensual,
    costo_vida_actualizado: costo_vida_mensual_actualizado,
    anios_retiro,
    mensaje_retiro: `Años de retiro posibles: ${anios_retiro}. Ten en cuenta que tu costo de vida mensual se ha actualizado por inflación de $${costo_vida_mensual.toFixed(2)} a $${costo_vida_mensual_actualizado.toFixed(2)} tras ${total_anios} años.`
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      capital_inicial,
      inversion_mensual,
      tasa_anual,
      total_anios,
      costo_vida_mensual,
      inflacion_anual
    } = body

    // Validar que todos los campos necesarios estén presentes
    if (!capital_inicial || !inversion_mensual || !tasa_anual || !total_anios || !costo_vida_mensual) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const resultados = calcularInversion(
      Number(capital_inicial),
      Number(inversion_mensual),
      Number(tasa_anual),
      Number(total_anios),
      Number(costo_vida_mensual),
      Number(inflacion_anual || 0)
    )

    return NextResponse.json(resultados)
  } catch (error) {
    console.error('Error en el cálculo:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
} 