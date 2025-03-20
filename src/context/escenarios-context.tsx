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
        setEscenarios(JSON.parse(escenariosGuardados))
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

  // Calcular resultado de un escenario
  const calcularResultado = (escenario: Escenario) => {
    const { 
      montoInicial, 
      aportacionMensual, 
      tasaInteres, 
      plazoAnios,
      inflacion,
      edadActual,
      edadRetiro
    } = escenario
    
    const tasaDecimal = tasaInteres / 100
    const inflacionDecimal = inflacion / 100
    const aportacionAnual = aportacionMensual * 12
    const aniosTotales = edadRetiro - edadActual

    let montoFinal = montoInicial
    const crecimientoPorAnio = [montoInicial]

    for (let i = 0; i < aniosTotales; i++) {
      // Ajustar por inflación cada año
      const tasaRealAnual = (1 + tasaDecimal) / (1 + inflacionDecimal) - 1
      montoFinal = montoFinal * (1 + tasaRealAnual) + aportacionAnual
      crecimientoPorAnio.push(montoFinal)
    }

    return {
      montoFinal,
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