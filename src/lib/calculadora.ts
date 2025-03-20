interface FormData {
  capital_inicial: number;
  aporte_mensual: number;
  rendimiento_anual: number;
  edad_actual: number;
  edad_retiro: number;
  costo_vida_mensual: number;
  inflacion_anual: number;
}

interface ResultadosInversion {
  monto_total: number;
  ganancia_neta: number;
  total_invertido: number;
  anios_retiro: number | "∞";
  costo_vida_inicial: number;
  costo_vida_actualizado: number;
  montoFinal: number;
  aportesTotales: number;
  rendimientoTotal: number;
  proyeccionAnual: Array<{
    año: number;
    saldo: number;
    aportesAcumulados: number;
    rendimientoAcumulado: number;
  }>;
}

export function calcularInversion(formData: FormData): ResultadosInversion {
  const años_hasta_retiro = formData.edad_retiro - formData.edad_actual;
  const costo_vida_inicial = formData.costo_vida_mensual;
  const costo_vida_actualizado = formData.costo_vida_mensual * Math.pow(1 + formData.inflacion_anual / 100, años_hasta_retiro);
  
  let monto_total = formData.capital_inicial;
  const aporte_mensual = formData.aporte_mensual;
  
  // Calcular monto total y ganancia
  for (let año = 1; año <= años_hasta_retiro; año++) {
    const rendimiento_anual = monto_total * (formData.rendimiento_anual / 100);
    monto_total = monto_total + rendimiento_anual + (aporte_mensual * 12);
  }
  
  const total_invertido = formData.capital_inicial + (aporte_mensual * 12 * años_hasta_retiro);
  const ganancia_neta = monto_total - total_invertido;
  
  // Calcular años que durará el capital
  let capital_restante = monto_total;
  let anios_retiro: number | "∞" = 0;
  const gasto_anual = costo_vida_actualizado * 12;
  
  if (monto_total * (formData.rendimiento_anual / 100) >= gasto_anual) {
    anios_retiro = "∞"; // El capital durará indefinidamente
  } else {
    while (capital_restante > 0) {
      const rendimiento = capital_restante * (formData.rendimiento_anual / 100);
      capital_restante = capital_restante + rendimiento - gasto_anual;
      if (capital_restante > 0) anios_retiro = (anios_retiro as number) + 1;
    }
  }

  // Crear array de proyección anual
  const proyeccionAnual = [];
  let saldoActual = formData.capital_inicial;
  let aportesAcumulados = formData.capital_inicial;
  let rendimientoAcumulado = 0;
  
  // Agregar el año inicial (año 0)
  proyeccionAnual.push({
    año: 0,
    saldo: Math.round(saldoActual),
    aportesAcumulados: Math.round(aportesAcumulados),
    rendimientoAcumulado: 0
  });
  
  for (let año = 1; año <= años_hasta_retiro; año++) {
    // Primero calculamos el rendimiento del saldo actual
    const rendimientoAnual = saldoActual * (formData.rendimiento_anual / 100);
    rendimientoAcumulado += rendimientoAnual;
    
    // Luego sumamos el aporte anual
    const aporteAnual = aporte_mensual * 12;
    aportesAcumulados += aporteAnual;
    
    // Finalmente actualizamos el saldo
    saldoActual = saldoActual + rendimientoAnual + aporteAnual;
    
    proyeccionAnual.push({
      año,
      saldo: Math.round(saldoActual),
      aportesAcumulados: Math.round(aportesAcumulados),
      rendimientoAcumulado: Math.round(rendimientoAcumulado)
    });

    console.log(`Año ${año}:`, {
      saldo: Math.round(saldoActual),
      aportes: Math.round(aportesAcumulados),
      rendimiento: Math.round(rendimientoAcumulado)
    });
  }

  return {
    monto_total: Math.round(monto_total),
    ganancia_neta: Math.round(ganancia_neta),
    total_invertido: Math.round(total_invertido),
    anios_retiro,
    costo_vida_inicial,
    costo_vida_actualizado,
    montoFinal: Math.round(monto_total),
    aportesTotales: Math.round(total_invertido),
    rendimientoTotal: Math.round(ganancia_neta),
    proyeccionAnual
  };
} 