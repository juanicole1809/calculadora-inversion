"use client"

import { useState, useEffect, FormEvent } from "react"
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
  const [showNameModal, setShowNameModal] = useState(false)
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
    }
  }, [])

  // Manual navigation
  const goToPhrase = (index: number) => {
    setActivePhrase(index)
  }

  const handleStartClick = () => {
    // Si no hay nombre guardado, mostrar el modal
    if (!userName) {
      setShowNameModal(true)
    } else {
      // Si ya hay un nombre, ir directamente a la calculadora
      router.push("/calculadora")
    }
  }

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (userName.trim()) {
      localStorage.setItem("userName", userName.trim())
      setShowNameModal(false)
      router.push("/calculadora")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            Planifica tu retiro con confianza
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Descubre cuánto necesitas ahorrar hoy para asegurar un retiro tranquilo mañana con nuestra calculadora de inversión.
          </p>
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

          {/* Dots navigation - moved outside the relative container */}
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

        {/* CTA Section with enhanced design */}
        <div className="text-center space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-slate-100 mb-16">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              {userName ? `¡Hola ${userName}!` : 'Calcula tu plan de retiro personalizado'}
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto mb-6">
              Nuestra calculadora te ayudará a visualizar el crecimiento de tus inversiones y planificar un retiro
              financieramente seguro según tu estilo de vida deseado.
            </p>
          </div>

          <Button 
            size="lg" 
            className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            onClick={handleStartClick}
          >
            Empezar ahora
            <ArrowRight className="ml-2" size={20} />
          </Button>

          <p className="text-sm text-slate-500 mt-4">Toma el control de tu futuro financiero en menos de 5 minutos</p>
        </div>

        {/* Process Steps - now more visually connected */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-slate-800">Cómo funciona</h3>
          <div className="grid md:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Ingresa tus datos</h3>
              <p className="text-slate-600">
                Personaliza tu plan de retiro con información sobre tu edad, estilo de vida y capacidad de ahorro.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Calcula tu inversión</h3>
              <p className="text-slate-600">
                Visualiza cómo crecerán tus inversiones con el tiempo y el poder del interés compuesto.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Planifica tu retiro</h3>
              <p className="text-slate-600">
                Obtén un plan claro para alcanzar tus metas financieras y asegurar un retiro cómodo y sin preocupaciones.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para solicitar el nombre */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full animate-in fade-in-50 zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">¡Personaliza tu experiencia!</h3>
              <p className="text-slate-600">
                Para brindarte un análisis más personalizado, nos gustaría conocer tu nombre
              </p>
            </div>

            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName" className="text-sm font-medium">
                  Tu nombre
                </Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Escribe tu nombre aquí"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-slate-500">Tu nombre se guardará localmente y lo usaremos para personalizar tus resultados</p>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowNameModal(false)
                    router.push("/calculadora")
                  }}
                >
                  Omitir
                </Button>
                <Button 
                  type="submit" 
                  disabled={!userName.trim()} 
                  className="bg-primary hover:bg-primary/90"
                >
                  Continuar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
