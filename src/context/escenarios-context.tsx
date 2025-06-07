"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Tipos
export interface Escenario {
  id: string
  nombre: string
  montoInicial: number
  aportacionMensual: number
  tasaInteres: number
  plazoAnios: number
  inflacion: number
  edadActual: number
  edadRetiro: number
  costoVidaMensual: number
  actualizarAportePorInflacion: boolean
  color: string
  resultado?: number
  crecimientoPorAnio?: number[]
}

// Colores para los escenarios
export const coloresEscenarios = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
]

interface EscenariosContextType {
  escenarios: Escenario[]
  agregarEscenario: (escenario: Omit<Escenario, "id" | "color" | "resultado" | "crecimientoPorAnio">) => string
  editarEscenario: (id: string, escenario: Partial<Escenario>) => void
  eliminarEscenario: (id: string) => void
  calcularResultado: (escenario: Escenario) => { montoFinal: number; crecimientoPorAnio: number[] }
}

const EscenariosContext = createContext<EscenariosContextType | undefined>(undefined)

export function EscenariosProvider({ children }: { children: ReactNode }) {
  const [escenarios, setEscenarios] = useState<Escenario[]>([])

  // Cargar escenarios del localStorage al iniciar
  useEffect(() => {
    const escenariosGuardados = localStorage.getItem("escenarios")
    if (escenariosGuardados) {
      try {
        const escenariosParsed = JSON.parse(escenariosGuardados)
        // Migración: agregar actualizarAportePorInflacion a escenarios existentes
        const escenariosConMigracion = escenariosParsed.map((escenario: any) => ({
          ...escenario,
          actualizarAportePorInflacion: escenario.actualizarAportePorInflacion ?? true
        }))
        setEscenarios(escenariosConMigracion)
      } catch (error) {
        console.error("Error al cargar escenarios:", error)
      }
    }
  }, [])

  // Guardar escenarios en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("escenarios", JSON.stringify(escenarios))
  }, [escenarios])

  // Generar ID único
  const generarId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  // Calcular resultado de un escenario - MISMA LÓGICA QUE LA API
  const calcularResultado = (escenario: Escenario) => {
    const { 
      montoInicial, 
      aportacionMensual, 
      tasaInteres, 
      plazoAnios,
      inflacion,
      actualizarAportePorInflacion
    } = escenario
    
    // Convertir años a meses
    const total_meses = Math.floor(plazoAnios * 12)
    
    // Convertir tasas anuales a mensual
    const tasa_mensual = tasaInteres / 100 / 12
    
    // Cálculo del monto acumulado durante la fase de inversión
    let monto_total = montoInicial
    if (tasaInteres === 0) {
      if (actualizarAportePorInflacion) {
        // Si actualizamos los aportes por inflación
        let aporte_mensual_actual = aportacionMensual;
        for (let i = 0; i < total_meses; i++) {
          monto_total += aporte_mensual_actual;
          if ((i + 1) % 12 === 0) {
            // Actualizamos el aporte cada 12 meses (anualmente)
            aporte_mensual_actual *= (1 + (inflacion / 100));
          }
        }
      } else {
        // Si la tasa es 0% y no actualizamos los aportes, simplemente sumamos los aportes sin interés
        monto_total = montoInicial + (aportacionMensual * total_meses);
      }
    } else {
      if (actualizarAportePorInflacion) {
        // Con interés compuesto y actualización de aportes por inflación
        let aporte_mensual_actual = aportacionMensual;
        for (let i = 0; i < total_meses; i++) {
          monto_total = (monto_total + aporte_mensual_actual) * (1 + tasa_mensual);
          if ((i + 1) % 12 === 0) {
            // Actualizamos el aporte cada 12 meses (anualmente)
            aporte_mensual_actual *= (1 + (inflacion / 100));
          }
        }
      } else {
        // Con interés compuesto y aporte fijo
        for (let i = 0; i < total_meses; i++) {
          monto_total = (monto_total + aportacionMensual) * (1 + tasa_mensual);
        }
      }
    }

    // Generar proyección anual - MISMA LÓGICA QUE LA API
    const crecimientoPorAnio = [];
    let saldoAnual = montoInicial;
    let aportesAcumulados = montoInicial;
    let rendimientoAcumulado = 0;
    
    // Añadir año inicial (año 0)
    crecimientoPorAnio.push(Math.round(saldoAnual));
    
    // Calcular para cada año
    let aporte_mensual_actual = aportacionMensual;
    for (let año = 1; año <= plazoAnios; año++) {
      let saldoInicioAño = saldoAnual;
      let aportesAño = 0;
      
      // Calcular 12 meses de este año
      for (let mes = 1; mes <= 12; mes++) {
        saldoAnual = (saldoAnual + aporte_mensual_actual) * (1 + tasa_mensual);
        aportesAño += aporte_mensual_actual;
      }
      
      // Actualizar el aporte mensual por inflación si corresponde
      if (actualizarAportePorInflacion) {
        aporte_mensual_actual *= (1 + (inflacion / 100));
      }
      
      aportesAcumulados += aportesAño;
      
      // El rendimiento es la diferencia entre el saldo final y el saldo inicial + aportes
      const rendimientoAño = saldoAnual - (saldoInicioAño + aportesAño);
      rendimientoAcumulado += rendimientoAño;
      
      crecimientoPorAnio.push(Math.round(saldoAnual));
    }

    return {
      montoFinal: monto_total, // Sin redondear para mantener precisión
      crecimientoPorAnio,
    }
  }

  // Agregar nuevo escenario
  const agregarEscenario = (nuevoEscenario: Omit<Escenario, "id" | "color" | "resultado" | "crecimientoPorAnio">) => {
    const escenarioCompleto: Escenario = {
      ...nuevoEscenario,
      id: generarId(),
      color: coloresEscenarios[escenarios.length % coloresEscenarios.length],
    }

    const resultado = calcularResultado(escenarioCompleto)
    const escenarioConResultado = {
      ...escenarioCompleto,
      resultado: resultado.montoFinal,
      crecimientoPorAnio: resultado.crecimientoPorAnio,
    }

    setEscenarios([...escenarios, escenarioConResultado])
    return escenarioConResultado.id
  }

  // Editar escenario existente
  const editarEscenario = (id: string, cambios: Partial<Escenario>) => {
    setEscenarios(
      escenarios.map((escenario) => {
        if (escenario.id !== id) return escenario

        const escenarioActualizado = { ...escenario, ...cambios }
        const resultado = calcularResultado(escenarioActualizado)

        return {
          ...escenarioActualizado,
          resultado: resultado.montoFinal,
          crecimientoPorAnio: resultado.crecimientoPorAnio,
        }
      }),
    )
  }

  // Eliminar escenario
  const eliminarEscenario = (id: string) => {
    setEscenarios(escenarios.filter((e) => e.id !== id))
  }

  return (
    <EscenariosContext.Provider
      value={{
        escenarios,
        agregarEscenario,
        editarEscenario,
        eliminarEscenario,
        calcularResultado,
      }}
    >
      {children}
    </EscenariosContext.Provider>
  )
}

export function useEscenarios() {
  const context = useContext(EscenariosContext)
  if (context === undefined) {
    throw new Error("useEscenarios debe usarse dentro de un EscenariosProvider")
  }
  return context
} 