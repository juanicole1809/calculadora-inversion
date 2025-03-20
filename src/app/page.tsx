"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, TrendingUp, PiggyBank, LineChart, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Home() {
  const [activePhrase, setActivePhrase] = useState(0)
  const [userName, setUserName] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [inputName, setInputName] = useState("")
  const router = useRouter()

  const phrases = [
    {
      title: "¿Sabes cuánto necesitas para tu retiro?",
      description: "La mayoría de las personas subestiman la cantidad que necesitarán para vivir cómodamente.",
      icon: <PiggyBank className="h-8 w-8 text-primary" />,
    },
    {
      title: "El tiempo es tu mejor aliado financiero",
      description: "Comenzar a invertir temprano puede duplicar o triplicar tu patrimonio final.",
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
    },
    {
      title: "¿Estás aprovechando el interés compuesto?",
      description: "Einstein lo llamó la octava maravilla del mundo. Quien lo entiende, lo gana. Quien no, lo paga.",
      icon: <LineChart className="h-8 w-8 text-primary" />,
    },
    {
      title: "La inflación reduce tu poder adquisitivo",
      description: "Sin inversiones, tu dinero pierde valor cada año. ¿Estás preparado para contrarrestarlo?",
      icon: <TrendingUp className="h-8 w-8 text-primary rotate-180" />,
    },
    {
      title: "Planifica hoy tu retiro del mañana",
      description: "Cada peso invertido hoy trabaja para ti mientras duermes, construyendo tu libertad financiera.",
      icon: <PiggyBank className="h-8 w-8 text-primary" />,
    },
  ]

  // Auto-rotate phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePhrase((current) => (current + 1) % phrases.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [phrases.length])

  // Verificar si ya hay un nombre guardado
  useEffect(() => {
    const savedName = localStorage.getItem("userName")
    if (savedName) {
      setUserName(savedName)
      setInputName(savedName)
    }
  }, [])

  // Manual navigation
  const goToPhrase = (index: number) => {
    setActivePhrase(index)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Calculadora de Inversión para tu Retiro
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Planifica tu futuro financiero y descubre cómo alcanzar la independencia financiera
          </p>

          {/* CTA Section movida arriba */}
          <div className="text-center space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-100 mb-16">
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {userName && !editingName ? `¡Hola ${userName}!` : 'Calcula tu plan de retiro personalizado'}
                </h2>
                {userName && !editingName && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => {
                      setEditingName(true);
                      setInputName("");
                    }}
                  >
                    <span className="sr-only">Editar nombre</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </Button>
                )}
              </div>
              <p className="text-slate-600 max-w-lg mx-auto mb-6">
                Nuestra calculadora te ayudará a visualizar el crecimiento de tus inversiones y planificar un retiro
                financieramente seguro según tu estilo de vida deseado.
              </p>
            </div>

            {editingName || !userName ? (
              <div className="max-w-xs mx-auto mb-4">
                <Input
                  type="text"
                  placeholder="Tu nombre..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="text-center"
                />
              </div>
            ) : null}

            <Button 
              size="lg" 
              className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              onClick={() => {
                if (editingName || !userName) {
                  if (inputName.trim()) {
                    localStorage.setItem("userName", inputName.trim());
                    setUserName(inputName.trim());
                    setEditingName(false);
                  } else if (editingName) {
                    localStorage.removeItem("userName");
                    setUserName("");
                    setEditingName(false);
                  }
                }
                router.push("/calculadora");
              }}
            >
              Empezar ahora
              <ArrowRight className="ml-2" size={20} />
            </Button>

            <p className="text-sm text-slate-500 mt-4">Toma el control de tu futuro financiero en menos de 5 minutos</p>
          </div>
        </div>

        {/* Phrases Carousel */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="relative h-72 sm:h-64 md:h-56 mb-12">
            {phrases.map((phrase, index) => (
              <Card
                key={index}
                className={`absolute w-full transition-all duration-500 ease-in-out shadow-lg border-slate-200 ${
                  index === activePhrase ? "opacity-100 translate-y-0 z-10" : "opacity-0 translate-y-8 -z-10"
                }`}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start sm:items-center gap-3 mb-3">
                    <div className="flex-shrink-0 mt-1 sm:mt-0">
                      {phrase.icon}
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800">{phrase.title}</h2>
                  </div>
                  <p className="text-slate-600 text-base md:text-lg">{phrase.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Dots navigation */}
          <div className="flex justify-center gap-2 mt-2">
            {phrases.map((_, index) => (
              <button
                key={index}
                onClick={() => goToPhrase(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === activePhrase ? "bg-primary" : "bg-slate-300"
                }`}
                aria-label={`Ver frase ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Nueva sección de pasos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:border-primary/60 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Datos Personales</h3>
            <p className="text-stone-600 text-sm">
              Ingresa tu edad actual, edad deseada de retiro y el costo de vida mensual que aspiras mantener durante tu jubilación.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:border-primary/60 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">2</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Plan de Inversión</h3>
            <p className="text-stone-600 text-sm">
              Define tu capital inicial, aportes mensuales y selecciona el rendimiento esperado según tu perfil de riesgo.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200 hover:border-primary/60 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-xl">3</span>
            </div>
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Análisis Detallado</h3>
            <p className="text-stone-600 text-sm">
              Obtén proyecciones financieras, tiempo para alcanzar la independencia financiera y recomendaciones personalizadas.
            </p>
          </div>
        </div>

        {/* Nueva sección de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-3">¿Qué obtendrás?</h3>
            <ul className="text-left text-stone-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Proyección detallada del crecimiento de tu capital
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Cálculo del tiempo necesario para alcanzar la independencia financiera
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Análisis del impacto de la inflación en tus ahorros
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Recomendaciones personalizadas para optimizar tu plan
              </li>
            </ul>
          </div>

          <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900 mb-3">Características</h3>
            <ul className="text-left text-stone-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Resultados descargables en PDF
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Gráficos interactivos de proyección
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Comparativas de diferentes escenarios
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                Respuestas a preguntas frecuentes sobre tu plan
              </li>
            </ul>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-slate-800">Preguntas Frecuentes</h3>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <h4 className="text-lg font-semibold mb-2">¿Qué es la independencia financiera?</h4>
              <p className="text-slate-600">
                La independencia financiera se alcanza cuando tus inversiones generan suficientes intereses para cubrir todos tus gastos mensuales, 
                sin necesidad de seguir trabajando o aportar más dinero.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <h4 className="text-lg font-semibold mb-2">¿Por qué es importante el interés compuesto?</h4>
              <p className="text-slate-600">
                El interés compuesto es considerado la octava maravilla del mundo porque genera "interés sobre el interés", 
                creando un efecto de bola de nieve que acelera el crecimiento de tu dinero con el tiempo.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <h4 className="text-lg font-semibold mb-2">¿Cómo afecta la inflación a mi retiro?</h4>
              <p className="text-slate-600">
                La inflación reduce el poder adquisitivo de tu dinero con el tiempo. Nuestra calculadora tiene en cuenta este factor 
                para asegurar que tus proyecciones sean realistas y mantengas tu nivel de vida durante el retiro.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <h4 className="text-lg font-semibold mb-2">¿Cuándo es el mejor momento para empezar?</h4>
              <p className="text-slate-600">
                El mejor momento para empezar a planificar tu retiro es ahora. Cuanto antes comiences, más tiempo tendrá tu dinero 
                para crecer gracias al interés compuesto, y menor será el aporte mensual necesario para alcanzar tus metas.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="max-w-4xl mx-auto mt-12 p-4 bg-stone-50 rounded-lg border border-stone-200">
          <p className="text-xs text-stone-600 leading-relaxed text-center">
            Esta calculadora proporciona estimaciones con fines exclusivamente educativos e informativos. Los resultados mostrados 
            no constituyen asesoramiento financiero ni garantía de rendimiento futuro. Las proyecciones son hipotéticas y no consideran 
            factores como impuestos, comisiones o condiciones económicas imprevistas.
          </p>
        </div>
      </div>
    </div>
  )
}
