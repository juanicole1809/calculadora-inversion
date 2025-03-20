import { NextResponse } from 'next/server'

function calcularInversion(
  capital_inicial: number,
  inversion_mensual: number,
  tasa_anual: number,
  total_anios: number,
  costo_vida_mensual: number,
  inflacion_anual: number,
  actualizar_aporte_por_inflacion: boolean = false
) {
  // Convertir años a meses
  const total_meses = Math.floor(total_anios * 12)
  
  // Convertir tasas anuales a mensual
  const tasa_mensual = tasa_anual / 100 / 12
  const inflacion_mensual = inflacion_anual / 100 / 12
  
  // Cálculo del monto acumulado durante la fase de inversión
  let monto_total = capital_inicial
  if (tasa_anual === 0) {
    if (actualizar_aporte_por_inflacion) {
      // Si actualizamos los aportes por inflación
      let aporte_mensual_actual = inversion_mensual;
      for (let i = 0; i < total_meses; i++) {
        monto_total += aporte_mensual_actual;
        if ((i + 1) % 12 === 0) {
          // Actualizamos el aporte cada 12 meses (anualmente)
          aporte_mensual_actual *= (1 + (inflacion_anual / 100));
        }
      }
    } else {
      // Si la tasa es 0% y no actualizamos los aportes, simplemente sumamos los aportes sin interés
      monto_total = capital_inicial + (inversion_mensual * total_meses);
    }
  } else {
    if (actualizar_aporte_por_inflacion) {
      // Con interés compuesto y actualización de aportes por inflación
      let aporte_mensual_actual = inversion_mensual;
      for (let i = 0; i < total_meses; i++) {
        monto_total = (monto_total + aporte_mensual_actual) * (1 + tasa_mensual);
        if ((i + 1) % 12 === 0) {
          // Actualizamos el aporte cada 12 meses (anualmente)
          aporte_mensual_actual *= (1 + (inflacion_anual / 100));
        }
      }
    } else {
      // Con interés compuesto y aporte fijo
      for (let i = 0; i < total_meses; i++) {
        monto_total = (monto_total + inversion_mensual) * (1 + tasa_mensual);
      }
    }
  }
  
  // Cálculo del total de aportes considerando si se actualizan por inflación
  let total_aportes_mensuales;
  if (actualizar_aporte_por_inflacion) {
    // Recalculamos el total de aportes con inflación
    total_aportes_mensuales = 0;
    let aporte_mensual_actual = inversion_mensual;
    for (let i = 0; i < total_meses; i++) {
      total_aportes_mensuales += aporte_mensual_actual;
      if ((i + 1) % 12 === 0) {
        aporte_mensual_actual *= (1 + (inflacion_anual / 100));
      }
    }
  } else {
    total_aportes_mensuales = inversion_mensual * total_meses;
  }
  
  const total_invertido = capital_inicial + total_aportes_mensuales;
  const ganancia_neta = monto_total - total_invertido;
  
  // Actualizamos el costo de vida mensual con la inflación acumulada durante el periodo de inversión
  const factor_inflacion = Math.pow(1 + (inflacion_anual / 100), total_anios);
  const costo_vida_mensual_actualizado = costo_vida_mensual * factor_inflacion;
  
  // Generar proyección anual
  const proyeccionAnual = [];
  let saldoAnual = capital_inicial;
  let aportesAcumulados = capital_inicial;
  let rendimientoAcumulado = 0;
  
  // Añadir año inicial (año 0)
  proyeccionAnual.push({
    año: 0,
    saldo: Math.round(saldoAnual),
    aportesAcumulados: Math.round(aportesAcumulados),
    rendimientoAcumulado: 0
  });
  
  // Calcular para cada año
  let aporte_mensual_actual = inversion_mensual;
  for (let año = 1; año <= total_anios; año++) {
    let saldoInicioAño = saldoAnual;
    let aportesAño = 0;
    
    // Calcular 12 meses de este año
    for (let mes = 1; mes <= 12; mes++) {
      saldoAnual = (saldoAnual + aporte_mensual_actual) * (1 + tasa_mensual);
      aportesAño += aporte_mensual_actual;
    }
    
    // Actualizar el aporte mensual por inflación si corresponde
    if (actualizar_aporte_por_inflacion) {
      aporte_mensual_actual *= (1 + (inflacion_anual / 100));
    }
    
    aportesAcumulados += aportesAño;
    
    // El rendimiento es la diferencia entre el saldo final y el saldo inicial + aportes
    const rendimientoAño = saldoAnual - (saldoInicioAño + aportesAño);
    rendimientoAcumulado += rendimientoAño;
    
    proyeccionAnual.push({
      año,
      saldo: Math.round(saldoAnual),
      aportesAcumulados: Math.round(aportesAcumulados),
      rendimientoAcumulado: Math.round(rendimientoAcumulado)
    });
  }
  
  // Verificar si el capital nunca se agotará
  // Si la tasa es 0%, el capital siempre se agotará a menos que el costo de vida sea 0
  if (tasa_anual === 0 && costo_vida_mensual_actualizado === 0) {
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
      mensaje_retiro: `El capital no se agotará ya que tus gastos mensuales son de $0.`,
      montoFinal: Math.round(monto_total),
      aportesTotales: Math.round(total_invertido),
      rendimientoTotal: Math.round(ganancia_neta),
      proyeccionAnual
    }
  } else if (tasa_anual === 0) {
    // Con tasa 0% y gastos mayores a 0, calculamos cuánto tiempo durará el capital
    const meses_retiro = Math.floor(monto_total / costo_vida_mensual_actualizado);
    const anios_retiro = Math.round(meses_retiro / 12 * 10) / 10;
    
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
      mensaje_retiro: `Años de retiro posibles: ${anios_retiro}. Con un rendimiento del 0%, tu capital se irá agotando mes a mes sin generar intereses.`,
      montoFinal: Math.round(monto_total),
      aportesTotales: Math.round(total_invertido),
      rendimientoTotal: Math.round(ganancia_neta),
      proyeccionAnual
    }
  }
  
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
      mensaje_retiro: `El capital no se agotará: los intereses mensuales ($${interes_mensual_inicial.toFixed(2)}) son mayores que los retiros mensuales actualizados por inflación ($${retiro_mensual_inicial.toFixed(2)})`,
      montoFinal: Math.round(monto_total),
      aportesTotales: Math.round(total_invertido),
      rendimientoTotal: Math.round(ganancia_neta),
      proyeccionAnual
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
    mensaje_retiro: `Años de retiro posibles: ${anios_retiro}. Ten en cuenta que tu costo de vida mensual se ha actualizado por inflación de $${costo_vida_mensual.toFixed(2)} a $${costo_vida_mensual_actualizado.toFixed(2)} tras ${total_anios} años.`,
    montoFinal: Math.round(monto_total),
    aportesTotales: Math.round(total_invertido),
    rendimientoTotal: Math.round(ganancia_neta),
    proyeccionAnual
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
      inflacion_anual,
      actualizar_aporte_por_inflacion
    } = body

    // Validar que todos los campos necesarios estén presentes
    if (
      capital_inicial === undefined || 
      inversion_mensual === undefined || 
      tasa_anual === undefined || 
      total_anios === undefined || 
      costo_vida_mensual === undefined
    ) {
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
      Number(inflacion_anual || 0),
      Boolean(actualizar_aporte_por_inflacion || false)
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