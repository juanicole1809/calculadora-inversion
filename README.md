# MiRetiro - Calculadora de Inversión para Retiro

Este es un proyecto [Next.js](https://nextjs.org) que proporciona una calculadora interactiva para planificar inversiones a largo plazo con el objetivo de alcanzar la independencia financiera para el retiro.

## Características principales

- Cálculo de proyecciones de inversión basadas en capital inicial y aportes mensuales
- Simulaciones con diferentes tasas de rendimiento e inflación
- Visualización de resultados mediante gráficos dinámicos
- Análisis de tiempo para alcanzar independencia financiera
- Exportación de resultados a PDF
- Comparación de diferentes escenarios de inversión
- Diseño responsive optimizado para dispositivos móviles y escritorio

## Primeros pasos

Primero, instala las dependencias:

```bash
npm install
# o
yarn install
# o
pnpm install
```

Luego, ejecuta el servidor de desarrollo:

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## Estructura del proyecto

- `src/components`: Componentes reutilizables de la interfaz
- `src/lib`: Utilidades y funciones auxiliares
- `src/context`: Contextos de React para gestión de estado global
- `src/api`: Endpoints de la API para cálculos financieros

## Tecnologías utilizadas

- [Next.js](https://nextjs.org/) - Framework de React
- [TypeScript](https://www.typescriptlang.org/) - Tipado estático
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [shadcn/ui](https://ui.shadcn.com/) - Componentes de UI
- [Framer Motion](https://www.framer.com/motion/) - Animaciones
- [Recharts](https://recharts.org/) - Visualización de datos
- [date-fns](https://date-fns.org/) - Manipulación de fechas

## Aprende más

Para aprender más sobre Next.js, consulta los siguientes recursos:

- [Documentación de Next.js](https://nextjs.org/docs) - aprende sobre las características y API de Next.js.
- [Aprende Next.js](https://nextjs.org/learn) - un tutorial interactivo de Next.js.

Puedes revisar [el repositorio de GitHub de Next.js](https://github.com/vercel/next.js) - ¡tus comentarios y contribuciones son bienvenidos!

## Despliegue

La forma más sencilla de desplegar esta aplicación es utilizando la [Plataforma Vercel](https://vercel.com/new). Simplemente conecta tu repositorio de GitHub y Vercel se encargará del resto.

Consulta nuestra [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.

## Licencia

Este proyecto fue desarrollado por Juan Ignacio Colella.
