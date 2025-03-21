"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, PiggyBank, Edit2, Download, BarChart2, Layers, MessageCircle, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function Home() {
  const [userName, setUserName] = useState("")
  const [showNameEdit, setShowNameEdit] = useState(false)
  const [newName, setNewName] = useState("")

  // Cargar el nombre del usuario desde localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("userName")
    if (savedName) {
      setUserName(savedName)
      setNewName(savedName)
    }
  }, [])

  const handleNameUpdate = () => {
    if (newName.trim()) {
      localStorage.setItem("userName", newName.trim())
      setUserName(newName.trim())
      setShowNameEdit(false)
    } else {
      localStorage.removeItem("userName")
      setUserName("")
      setShowNameEdit(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="flex flex-col items-center text-center"
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="mb-6 flex items-center">
              <PiggyBank className="mr-2 h-10 w-10 text-black" />
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">MiRetiro</h1>
            </div>

            <h2 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
              Calculadora de Inversión para tu Retiro
            </h2>

            <p className="mb-10 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Planifica tu futuro financiero y descubre cómo alcanzar la independencia financiera
            </p>

            <Card className="mb-10 w-full max-w-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-6 flex flex-col items-center">
                  <h3 className="mb-2 text-2xl font-bold">
                    {userName ? `¡Hola ${userName}!` : 'Calcula tu plan de retiro personalizado'}
                    <Button variant="ghost" size="icon" className="ml-2" onClick={() => setShowNameEdit(!showNameEdit)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </h3>

                  {showNameEdit && (
                    <div className="mt-2 flex w-full max-w-xs items-center space-x-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Tu nombre"
                        className="h-9"
                      />
                      <Button size="sm" onClick={handleNameUpdate}>
                        Guardar
                      </Button>
                    </div>
                  )}

                  <p className="text-center text-muted-foreground">
                    Nuestra calculadora te ayudará a visualizar el crecimiento de tus inversiones y planificar un retiro
                    financieramente seguro según tu estilo de vida deseado.
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button asChild size="lg" className="gap-2 px-8">
                    <Link href="/calculadora">
                      Empezar ahora
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    ¿Quieres conocer cómo funciona? <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Toma el control de tu futuro financiero en menos de 5 minutos
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-white px-4 py-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <p className="text-3xl font-bold text-primary">+30%</p>
              <p className="text-sm text-muted-foreground">Ahorro potencial con planificación</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-3xl font-bold text-primary">2x</p>
              <p className="text-sm text-muted-foreground">Crecimiento con interés compuesto</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <p className="text-3xl font-bold text-primary">-10 años</p>
              <p className="text-sm text-muted-foreground">Reducción en tiempo para el retiro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="how-it-works" className="bg-white px-4 py-8 scroll-mt-16">
        <div className="container mx-auto max-w-5xl">
          <Tabs defaultValue="benefits" className="w-full">
            <div className="mb-8 flex justify-center">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="benefits">Beneficios</TabsTrigger>
                <TabsTrigger value="process">Proceso</TabsTrigger>
                <TabsTrigger value="features">Características</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="benefits" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {[
                  {
                    title: "¿Sabes cuánto necesitas para tu retiro?",
                    description:
                      "La mayoría de las personas subestiman la cantidad que necesitarán para vivir cómodamente.",
                  },
                  {
                    title: "El tiempo es tu mejor aliado financiero",
                    description: "Comenzar a invertir temprano puede duplicar o triplicar tu patrimonio final.",
                  },
                  {
                    title: "¿Estás aprovechando el interés compuesto?",
                    description:
                      "Einstein lo llamó la octava maravilla del mundo. Quien lo entiende, lo gana. Quien no, lo paga.",
                  },
                  {
                    title: "La inflación reduce tu poder adquisitivo",
                    description:
                      "Sin inversiones, tu dinero pierde valor cada año. ¿Estás preparado para contrarrestarlo?",
                  },
                ].map((item, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="overflow-hidden bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="mb-2 text-xl font-bold">Planifica hoy tu retiro del mañana</h3>
                  <p className="text-muted-foreground">
                    Cada peso invertido hoy trabaja para ti mientras duermes, construyendo tu libertad financiera.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="process">
              <div className="grid gap-8 md:grid-cols-3">
                {[
                  {
                    number: "1",
                    title: "Datos Personales",
                    description:
                      "Ingresa tu edad actual, edad deseada de retiro y el costo de vida mensual que aspiras mantener durante tu jubilación.",
                  },
                  {
                    number: "2",
                    title: "Plan de Inversión",
                    description:
                      "Define tu capital inicial, aportes mensuales y selecciona el rendimiento esperado según tu perfil de riesgo.",
                  },
                  {
                    number: "3",
                    title: "Análisis Detallado",
                    description:
                      "Obtén proyecciones financieras, tiempo para alcanzar la independencia financiera y recomendaciones personalizadas.",
                  },
                ].map((step, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <span className="text-2xl font-bold">{step.number}</span>
                    </div>
                    <Card className="w-full">
                      <CardContent className="p-6 text-center">
                        <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="features">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold">¿Qué obtendrás?</h3>
                    <ul className="space-y-3">
                      {[
                        "Proyección del crecimiento de tu capital",
                        "Cálculo del tiempo necesario para alcanzar la independencia financiera",
                        "Análisis del impacto de la inflación en tus ahorros",
                        "Recomendaciones personalizadas para optimizar tu plan",
                      ].map((item, i) => (
                        <li key={i} className="flex items-start">
                          <div className="mr-2 mt-1 h-1.5 w-1.5 rounded-full bg-primary"></div>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-xl font-bold">Características</h3>
                    <ul className="grid gap-3">
                      {[
                        { icon: <Download className="h-4 w-4" />, text: "Resultados descargables en PDF" },
                        { icon: <BarChart2 className="h-4 w-4" />, text: "Gráficos interactivos de proyección" },
                        { icon: <Layers className="h-4 w-4" />, text: "Comparativas de diferentes escenarios" },
                        {
                          icon: <MessageCircle className="h-4 w-4" />,
                          text: "Respuestas a preguntas frecuentes sobre tu plan",
                        },
                      ].map((item, i) => (
                        <li key={i} className="flex items-center">
                          <div className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                            {item.icon}
                          </div>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-slate-50 px-4 py-16">
        <div className="container mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold">Preguntas Frecuentes</h2>

          <Accordion type="single" collapsible className="w-full">
            {[
              {
                question: "¿Qué es la independencia financiera?",
                answer:
                  "La independencia financiera se alcanza cuando tus inversiones generan suficientes intereses para cubrir todos tus gastos mensuales, sin necesidad de seguir trabajando o aportar más dinero.",
              },
              {
                question: "¿Por qué es importante el interés compuesto?",
                answer:
                  'El interés compuesto es considerado la octava maravilla del mundo porque genera "interés sobre el interés", creando un efecto de bola de nieve que acelera el crecimiento de tu dinero con el tiempo.',
              },
              {
                question: "¿Cómo afecta la inflación a mi retiro?",
                answer:
                  "La inflación reduce el poder adquisitivo de tu dinero con el tiempo. Nuestra calculadora tiene en cuenta este factor para asegurar que tus proyecciones sean realistas y mantengas tu nivel de vida durante el retiro.",
              },
              {
                question: "¿Cuándo es el mejor momento para empezar?",
                answer:
                  "El mejor momento para empezar a planificar tu retiro es ahora. Cuanto antes comiences, más tiempo tendrá tu dinero para crecer gracias al interés compuesto, y menor será el aporte mensual necesario para alcanzar tus metas.",
              },
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-lg font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-primary/10 px-4 py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold">¿Listo para asegurar tu futuro financiero?</h2>
          <p className="mb-8 text-muted-foreground">
            Comienza hoy mismo a planificar tu retiro y da el primer paso hacia la independencia financiera.
          </p>
          <Button asChild size="lg" className="gap-2 px-8">
            <Link href="/calculadora">
              Empezar ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 px-4 py-8 text-slate-200">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-4 text-center text-xs">
            <p className="mb-2 max-w-3xl mx-auto">
              Esta calculadora proporciona estimaciones con fines exclusivamente educativos e informativos. Los
              resultados mostrados no constituyen asesoramiento financiero ni garantía de rendimiento futuro. Las
              proyecciones son hipotéticas y no consideran factores como impuestos, comisiones o condiciones económicas
              imprevistas.
            </p>
            <p>© {new Date().getFullYear()} MiRetiro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
