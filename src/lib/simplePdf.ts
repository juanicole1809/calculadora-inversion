import jsPDF from 'jspdf';
import { format } from 'date-fns';

/**
 * Genera un PDF estilizado a partir de datos de resultados
 */
export function createSimplePDF(resultados: any, formData: any, uiValues: any) {
  try {
    console.log('🔍 Creando PDF estilizado con jsPDF');
    
    // Crear un nuevo documento PDF
    const pdf = new jsPDF();
    
    // Configurar márgenes
    const margin = 20;
    const marginTop = 25;
    const marginBottom = 30;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - marginTop - marginBottom;
    
    // Posición vertical inicial
    let y = marginTop;
    
    // Colores
    const colors = {
      primary: [52, 102, 189], // Azul primario
      secondary: [220, 53, 69], // Rojo
      success: [40, 167, 69], // Verde
      warning: [255, 193, 7], // Amarillo
      info: [23, 162, 184], // Azul claro
      dark: [52, 58, 64], // Oscuro
      light: [248, 249, 250], // Claro
      stone: [120, 113, 108], // Gris piedra
      
      background: [245, 245, 245] // Fondo gris claro
    };
    
    // Formatear moneda
    const formatCurrency = (number: number) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD'
      }).format(number).replace('US$', '$ USD');
    };
    
    // Formatear años
    const formatYears = (years: number | string) => {
      return typeof years === 'string' ? years : 
        new Intl.NumberFormat('es-ES', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(years) + ' años';
    };

    // Función para verificar espacio disponible y añadir nueva página si es necesario
    const checkAvailableSpace = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight - marginBottom) {
        pdf.addPage();
        y = marginTop;
        return true;
      }
      return false;
    };

    // Función para añadir un rectángulo (fondo)
    const addRect = (x: number, width: number, height: number, color: number[]) => {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y - height + 3, width, height, 'F');
    };
    
    // Función para añadir texto con salto de línea
    const addText = (text: string, fontSize: number, options: {
      isBold?: boolean,
      color?: number[],
      align?: 'left' | 'center' | 'right',
      withBackground?: boolean,
      backgroundWidth?: number,
      backgroundHeight?: number,
      backgroundPadding?: number,
      backgroundColor?: number[],
      withBorder?: boolean,
      borderColor?: number[],
      underline?: boolean,
      x?: number
    } = {}) => {
      // Configurar estilo de texto
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', options.isBold ? 'bold' : 'normal');
      
      // Color del texto
      const textColor = options.color || colors.dark;
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Posición horizontal según alineación
      let xPos = margin;
      const textOptions: any = {};
      
      // Si tiene alineación específica
      if (options.align === 'center') {
        xPos = pageWidth / 2;
        textOptions.align = 'center' as const;
      } else if (options.align === 'right') {
        xPos = pageWidth - margin;
        textOptions.align = 'right' as const;
      }
      
      // Si se proporciona una posición X específica, usarla
      if (options.x !== undefined) {
        xPos = options.x;
      }
      
      // Si tiene fondo
      if (options.withBackground) {
        const bgWidth = options.backgroundWidth || contentWidth;
        const bgHeight = options.backgroundHeight || fontSize + 6;
        const bgPadding = options.backgroundPadding || 0;
        const bgColor = options.backgroundColor || colors.background;
        
        // Dibujar fondo
        const rectX = options.align === 'center' ? (pageWidth - bgWidth) / 2 : margin - bgPadding;
        const rectY = y - 2;
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.roundedRect(rectX, rectY - bgHeight + 8, bgWidth, bgHeight, 2, 2, 'F');
        
        // Si tiene borde
        if (options.withBorder) {
          const borderColor = options.borderColor || colors.stone;
          pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          pdf.setLineWidth(0.1);
          pdf.roundedRect(rectX, rectY - bgHeight + 8, bgWidth, bgHeight, 2, 2, 'S');
        }
      }
      
      // Texto
      if (options.align) {
        pdf.text(text, xPos, y, textOptions);
      } else {
        pdf.text(text, xPos, y);
      }
      
      // Subrayado
      if (options.underline) {
        const textWidth = pdf.getTextWidth(text);
        pdf.setDrawColor(textColor[0], textColor[1], textColor[2]);
        pdf.setLineWidth(0.5);
        const lineY = y + 1;
        
        if (options.align === 'center') {
          pdf.line(xPos - textWidth / 2, lineY, xPos + textWidth / 2, lineY);
        } else if (options.align === 'right') {
          pdf.line(xPos - textWidth, lineY, xPos, lineY);
        } else {
          pdf.line(xPos, lineY, xPos + textWidth, lineY);
        }
      }
      
      // Avanzar posición vertical
      y += fontSize / 2 + 4;
    };
    
    // Función para añadir espacio
    const addSpace = (space: number = 10) => {
      y += space;
    };
    
    // Función para crear una tarjeta
    const addCard = (title: string, value: string, description?: string, options: {
      titleSize?: number;
      valueSize?: number;
      descSize?: number;
      bgColor?: number[];
      valueFontColor?: number[];
      borderColor?: number[];
      highlight?: boolean;
      extraInfo?: string;
    } = {}) => {
      // Calcular altura basada en descripción y posible info extra
      let cardHeight = 24;
      if (options.extraInfo) {
        cardHeight += 8;
      }
      
      // Verificar espacio disponible
      checkAvailableSpace(cardHeight + 10);
      
      // Fondo de la tarjeta
      const bgColor = options.bgColor || colors.background;
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'F');
      
      // Borde
      const borderColor = options.borderColor || colors.stone;
      pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      pdf.setLineWidth(0.1);
      pdf.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'S');
      
      // Highlight
      if (options.highlight) {
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.rect(margin, y, 2, cardHeight, 'F');
      }
      
      // Título
      pdf.setFontSize(options.titleSize || 10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.stone[0], colors.stone[1], colors.stone[2]);
      pdf.text(title, margin + 5, y + 5);
      
      // Valor
      pdf.setFontSize(options.valueSize || 14);
      pdf.setFont('helvetica', 'bold');
      const valueColor = options.valueFontColor || colors.dark;
      pdf.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      pdf.text(value, margin + 5, y + 14);
      
      // Descripción
      if (description) {
        pdf.setFontSize(options.descSize || 8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(colors.stone[0], colors.stone[1], colors.stone[2]);
        pdf.text(description, margin + 5, y + 20);
      }
      
      // Información adicional
      if (options.extraInfo) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(150, 150, 150);
        pdf.text(options.extraInfo, margin + 5, y + 28);
      }
      
      y += cardHeight + 5;
    };
    
    // Función para crear sección con barra de progreso
    const addProgressBar = (title: string, percent: number, value: string, options: {
      color?: number[];
      height?: number;
      description?: string;
    } = {}) => {
      // Verificar espacio disponible
      const requiredSpace = options.description ? 30 : 20;
      checkAvailableSpace(requiredSpace);
      
      const barColor = options.color || colors.success;
      const barHeight = options.height || 6;
      
      // Título
      addText(title, 10, { isBold: true, color: colors.stone });
      
      // Valor y porcentaje
      pdf.setFontSize(8);
      pdf.setTextColor(colors.stone[0], colors.stone[1], colors.stone[2]);
      pdf.text(value, margin, y);
      pdf.text(`${percent.toFixed(1)}%`, pageWidth - margin, y, { align: 'right' as const });
      
      y += 4;
      
      // Fondo de la barra
      pdf.setFillColor(230, 230, 230);
      pdf.roundedRect(margin, y, contentWidth, barHeight, 2, 2, 'F');
      
      // Barra de progreso
      const progressWidth = (contentWidth * Math.min(percent, 100)) / 100;
      pdf.setFillColor(barColor[0], barColor[1], barColor[2]);
      pdf.roundedRect(margin, y, progressWidth, barHeight, 2, 2, 'F');
      
      y += barHeight + 3;
      
      // Descripción adicional
      if (options.description) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text(options.description, margin, y);
        y += 5;
      }
      
      y += 5;
    };
    
    // Función para agregar una línea separadora
    const addSeparator = () => {
      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, margin + contentWidth, y);
      y += 5;
    };
    
    // Función para agregar seccion con datos condensados
    const addDataRow = (label: string, value: string, description?: string) => {
      // Verificar espacio disponible
      checkAvailableSpace(description ? 12 : 6);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.stone[0], colors.stone[1], colors.stone[2]);
      pdf.text(label, margin, y);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
      pdf.text(value, pageWidth - margin, y, { align: 'right' as const });
      
      if (description) {
        y += 4;
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(120, 120, 120);
        pdf.text(description, margin + 5, y);
      }
      
      y += 6;
    };
    
    // ======== CONSTRUCCIÓN DEL PDF ========
    
    // Dibujar un pequeño ícono de cerdo (PiggyBank) simplificado
    const drawPiggyBank = (x: number, y: number, size: number = 10) => {
      // Guardar estado
      pdf.saveGraphicsState();
      
      // Cuerpo del cerdo
      pdf.setFillColor(52, 102, 189); // Color azul primario
      pdf.ellipse(x, y, size/2, size/3, 'F');
      
      // Cabeza
      pdf.ellipse(x + size/2.2, y - size/4, size/3.5, size/4, 'F');
      
      // Orejas
      pdf.setFillColor(40, 85, 160); // Azul más oscuro
      pdf.ellipse(x + size/1.8, y - size/2.5, size/8, size/6, 'F');
      
      // Patas
      pdf.setFillColor(40, 85, 160); // Azul más oscuro
      pdf.ellipse(x - size/3, y + size/4, size/9, size/5, 'F');
      pdf.ellipse(x + size/3, y + size/4, size/9, size/5, 'F');
      
      // Restaurar estado
      pdf.restoreGraphicsState();
    };
    
    // Calcular posición para el ícono y título centrados
    const titleWidth = pdf.getTextWidth('MiRetiro');
    const iconSize = 8;
    const iconSpacing = 5;
    const combinedWidth = titleWidth + iconSize + iconSpacing;
    const titleX = (pageWidth - combinedWidth)/2;
    const iconX = titleX;
    
    // Dibujar el ícono
    drawPiggyBank(iconX + iconSize/2, marginTop - 2, iconSize);
    
    // Logo y Nombre
    addText('MiRetiro', 24, { 
      isBold: true, 
      align: 'left',
      color: colors.dark,  // Negro en lugar de azul
      x: iconX + iconSize + iconSpacing  // Posición específica después del ícono
    });
    
    // Encabezado
    addText('Calculadora de Retiro', 20, { 
      align: 'center', 
      color: colors.stone 
    });
    
    addText('Planifica tu futuro financiero', 12, { 
      align: 'center', 
      color: colors.stone 
    });
    
    addText(`Reporte generado: ${format(new Date(), 'dd/MM/yyyy')}`, 8, { 
      align: 'center', 
      color: colors.stone 
    });
    
    addSpace(10);
    
    // Línea divisoria
    addSeparator();
    
    // RESULTADOS PRINCIPALES - Tarjetas destacadas
    addText('RESUMEN PROYECTADO DE TU PLAN DE RETIRO', 14, { 
      isBold: true, 
      withBackground: true,
      backgroundHeight: 10,
      backgroundColor: [240, 240, 240],
      align: 'center'
    });
    
    addSpace(8);
    
    // Tres tarjetas principales
    addCard(
      'MONTO FINAL ACUMULADO', 
      formatCurrency(resultados.monto_total), 
      `Total a la edad de ${formData.edad_retiro} años`,
      { 
        bgColor: [248, 249, 250],
        extraInfo: 'Incluye capital inicial, aportes mensuales y rendimientos acumulados durante el período'
      }
    );
    
    addCard(
      'GANANCIA NETA OBTENIDA', 
      formatCurrency(resultados.ganancia_neta), 
      `+${((resultados.ganancia_neta / resultados.total_invertido) * 100).toFixed(0)}% sobre capital invertido`,
      { 
        bgColor: [240, 248, 255], 
        highlight: true,
        valueFontColor: colors.primary,
        extraInfo: 'Representa el rendimiento total generado por intereses compuestos'
      }
    );
    
    addCard(
      'DURACIÓN DE TU CAPITAL', 
      formatYears(resultados.anios_retiro), 
      resultados.anios_retiro === "∞" ? 
        "Tu capital se mantendrá indefinidamente" : 
        "Tiempo estimado antes de agotar el capital",
      {
        extraInfo: 'Basado en la tasa de retiro mensual equivalente al costo de vida ajustado por inflación'
      }
    );
    
    addSpace(5);
    
    // Cobertura de gastos
    addText('COBERTURA DE GASTOS MENSUALES', 12, { isBold: true });
    
    const interesesMensuales = resultados.monto_total * uiValues.rendimientoAnual / 100 / 12;
    const porcentajeCobertura = uiValues.rendimientoAnual === 0 ? 0 : 
      (interesesMensuales / resultados.costo_vida_actualizado) * 100;
    
    addProgressBar(
      'Intereses mensuales vs. Costo de vida', 
      porcentajeCobertura, 
      `${formatCurrency(interesesMensuales)} / ${formatCurrency(resultados.costo_vida_actualizado)}`,
      { 
        color: porcentajeCobertura >= 100 ? colors.success : colors.warning,
        description: 'La cobertura del 100% indica independencia financiera donde puedes vivir solo de los intereses'
      }
    );
    
    // Datos detallados
    addText('DATOS DE TU INVERSIÓN', 12, { 
      isBold: true, 
      withBackground: true,
      backgroundHeight: 8,
      backgroundColor: [245, 245, 245]
    });
    
    addSpace(4);
    
    // Sección de datos de inversión en tabla
    addDataRow('Capital inicial:', formatCurrency(resultados.capital_inicial), 
      'Cantidad con la que inicias tu inversión');
    addDataRow('Aporte mensual:', formatCurrency(resultados.inversion_mensual),
      'Cantidad que aportarás cada mes a tu inversión');
    addDataRow('Total aportado:', formatCurrency(resultados.total_aportes_mensuales),
      'Suma total de todos tus aportes mensuales');
    addDataRow('Total invertido:', formatCurrency(resultados.total_invertido),
      'Capital inicial más todos los aportes mensuales');
    addDataRow('Rendimiento anual:', `${uiValues.rendimientoAnual}%`,
      'Tasa de rendimiento anual esperada para tu inversión');
    addDataRow('Inflación anual:', `${uiValues.inflacionAnual}%`,
      'Tasa de inflación anual esperada durante el periodo');
    
    addSeparator();
    
    // Datos personales
    addText('DATOS PERSONALES', 12, { 
      isBold: true, 
      withBackground: true,
      backgroundHeight: 8,
      backgroundColor: [245, 245, 245]
    });
    
    addSpace(4);
    
    addDataRow('Edad actual:', `${formData.edad_actual} años`);
    addDataRow('Edad de retiro:', `${formData.edad_retiro} años`,
      `Te retirarás en ${formData.edad_retiro - formData.edad_actual} años`);
    addDataRow('Costo de vida mensual actual:', formatCurrency(resultados.costo_vida_inicial));
    addDataRow('Costo de vida mensual al retirarte:', formatCurrency(resultados.costo_vida_actualizado),
      'Ajustado por la inflación proyectada durante el periodo');
    
    // Mensaje de análisis
    checkAvailableSpace(60); // Asegurar que tenemos espacio suficiente para la sección de análisis
    
    addSpace(10);
    
    addText('ANÁLISIS DE TU INDEPENDENCIA FINANCIERA', 14, { 
      isBold: true, 
      align: 'center',
      color: colors.primary
    });
    
    addSpace(5);
    
    // Mostrar mensaje distinto según la cobertura de gastos
    if (porcentajeCobertura >= 100) {
      // Fondo verde claro para mensaje positivo
      pdf.setFillColor(240, 255, 240);
      pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');
      
      // Borde verde
      pdf.setDrawColor(40, 167, 69);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentWidth, 30, 3, 3, 'S');
      
      // Texto
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(40, 167, 69);
      pdf.text('¡Felicidades!', pageWidth / 2, y + 10, { align: 'center' as const });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(40, 100, 40);
      pdf.text(
        'Según las proyecciones, al llegar a tu edad de retiro habrás alcanzado la independencia financiera.', 
        pageWidth / 2, y + 18, { align: 'center' as const, maxWidth: contentWidth - 10 }
      );
      
      y += 35;
    } else {
      // Fondo amarillo claro para mensaje de advertencia
      pdf.setFillColor(255, 253, 235);
      pdf.roundedRect(margin, y, contentWidth, 40, 3, 3, 'F');
      
      // Borde amarillo
      pdf.setDrawColor(255, 193, 7);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, y, contentWidth, 40, 3, 3, 'S');
      
      // Texto
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(180, 120, 0);
      pdf.text('Todavía no alcanzas la independencia financiera', pageWidth / 2, y + 10, { align: 'center' as const });
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 80, 0);
      
      // Calcular cuanto capital necesitamos
      const capitalNecesario = uiValues.rendimientoAnual === 0 ? 
        Infinity : (resultados.costo_vida_actualizado * 12) / (uiValues.rendimientoAnual / 100);
      const capitalFaltante = capitalNecesario - resultados.monto_total;
      
      pdf.text(
        `Necesitarás un capital total de ${formatCurrency(capitalNecesario)} para generar suficientes intereses.`,
        pageWidth / 2, y + 18, { align: 'center' as const, maxWidth: contentWidth - 10 }
      );
      
      pdf.text(
        `Al momento de tu retiro, te faltarán ${formatCurrency(capitalFaltante)}.`,
        pageWidth / 2, y + 26, { align: 'center' as const, maxWidth: contentWidth - 10 }
      );
      
      y += 45;
    }
    
    // Distribución gráfica del capital
    checkAvailableSpace(50); // Verificar espacio para el gráfico
    addText('DISTRIBUCIÓN DE TU CAPITAL', 12, { isBold: true });
    
    const proporcionCapital = (resultados.total_invertido / resultados.monto_total) * 100;
    const proporcionGanancia = (resultados.ganancia_neta / resultados.monto_total) * 100;
    
    // Barra de distribución
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin, y, contentWidth, 15, 2, 2, 'F');
    
    // Capital invertido (azul)
    const capitalWidth = (contentWidth * proporcionCapital) / 100;
    pdf.setFillColor(70, 130, 180); // Steel Blue
    pdf.rect(margin, y, capitalWidth, 15, 'F');
    
    // Ganancia (verde)
    const gananciaWidth = (contentWidth * proporcionGanancia) / 100;
    pdf.setFillColor(46, 139, 87); // Sea Green
    pdf.rect(margin + capitalWidth, y, gananciaWidth, 15, 'F');
    
    // Etiquetas
    if (proporcionCapital >= 15) {
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${proporcionCapital.toFixed(0)}%`, margin + capitalWidth/2, y + 8, { align: 'center' as const });
    }
    
    if (proporcionGanancia >= 15) {
      pdf.setFontSize(8);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${proporcionGanancia.toFixed(0)}%`, margin + capitalWidth + gananciaWidth/2, y + 8, { align: 'center' as const });
    }
    
    y += 20;
    
    // Leyenda
    pdf.setFontSize(8);
    
    // Capital invertido
    pdf.setFillColor(70, 130, 180);
    pdf.rect(margin, y, 4, 4, 'F');
    pdf.setTextColor(50, 50, 50);
    pdf.text(`Capital invertido: ${formatCurrency(resultados.total_invertido)}`, margin + 8, y + 3);
    
    // Ganancia
    pdf.setFillColor(46, 139, 87);
    pdf.rect(margin + contentWidth/2, y, 4, 4, 'F');
    pdf.text(`Ganancia: ${formatCurrency(resultados.ganancia_neta)}`, margin + contentWidth/2 + 8, y + 3);
    
    // Pie de página
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Pie de página con línea
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.1);
      pdf.line(margin, pdf.internal.pageSize.getHeight() - marginBottom + 10, pageWidth - margin, pdf.internal.pageSize.getHeight() - marginBottom + 10);
      
      // Texto de pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Calculadora de Retiro', margin, pdf.internal.pageSize.getHeight() - marginBottom + 15);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pdf.internal.pageSize.getHeight() - marginBottom + 15, { align: 'right' as const });
      
      // Información legal en pequeño
      pdf.setFontSize(6);
      pdf.text('Los resultados son estimaciones basadas en los datos proporcionados. Rendimientos pasados no garantizan rendimientos futuros.', 
        pageWidth / 2, pdf.internal.pageSize.getHeight() - marginBottom + 20, { align: 'center' as const });
    }
    
    // Guardar PDF
    const fileName = `Plan_Retiro_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    pdf.save(fileName);
    console.log('PDF estilizado generado exitosamente:', fileName);
    
    return true;
  } catch (error) {
    console.error('Error al generar PDF estilizado:', error);
    return false;
  }
} 