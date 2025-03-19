import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

/**
 * Exporta un elemento HTML a un archivo PDF
 * @param element Elemento HTML a exportar
 * @param filename Nombre del archivo PDF
 */
export async function exportToPDF(element: HTMLElement, filename?: string) {
  try {
    console.log('📄 exportToPDF: Iniciando exportación...');
    console.log('📄 exportToPDF: Elemento a exportar:', element);
    
    // Verificar que el elemento exista y tenga dimensiones
    const rect = element.getBoundingClientRect();
    console.log('📄 exportToPDF: Dimensiones del elemento:', 
      `ancho=${rect.width}px, alto=${rect.height}px, x=${rect.x}, y=${rect.y}`);
    
    if (rect.width === 0 || rect.height === 0) {
      console.error('📄 exportToPDF: El elemento tiene dimensiones cero');
      return false;
    }
    
    // Configuraciones para mejor calidad
    console.log('📄 exportToPDF: Iniciando captura con html2canvas...');
    const canvasOptions = {
      scale: 1.5,
      useCORS: true,
      logging: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      // Estas opciones ayudan con elementos fuera de la vista
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight
    };
    
    try {
      const canvas = await html2canvas(element, canvasOptions);
      console.log('📄 exportToPDF: Contenido capturado. Dimensiones:', canvas.width, 'x', canvas.height);
      
      // Verificar que el canvas tenga dimensiones
      if (canvas.width === 0 || canvas.height === 0) {
        console.error('📄 exportToPDF: Canvas tiene dimensiones cero');
        return false;
      }
      
      // Convertir a imagen con buena calidad
      console.log('📄 exportToPDF: Convirtiendo canvas a imagen...');
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      // Crear PDF y configurar tamaño
      console.log('📄 exportToPDF: Creando documento PDF...');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensiones manteniendo proporción
      const aspectRatio = canvas.width / canvas.height;
      const imgWidth = pdfWidth;
      const imgHeight = imgWidth / aspectRatio;
      console.log('📄 exportToPDF: Dimensiones de imagen en PDF:', 
        `ancho=${imgWidth}mm, alto=${imgHeight}mm, relación=${aspectRatio}`);
      
      // Añadir imagen a la primera página
      console.log('📄 exportToPDF: Añadiendo imagen a PDF...');
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      
      // Manejar contenido que excede la altura de una página
      if (imgHeight > pdfHeight) {
        console.log('📄 exportToPDF: Contenido excede altura de página, añadiendo páginas adicionales...');
        // Altura restante después de la primera página
        let heightLeft = imgHeight - pdfHeight;
        let position = -pdfHeight; // Posición para la siguiente página
        let pageCount = 1;
        
        while (heightLeft > 0) {
          // Añadir nueva página
          pdf.addPage();
          pageCount++;
          console.log(`📄 exportToPDF: Añadiendo página ${pageCount}...`);
          
          // Añadir la misma imagen pero con desplazamiento vertical
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          
          // Reducir altura restante y actualizar posición
          heightLeft -= pdfHeight;
          position -= pdfHeight;
        }
        
        console.log(`📄 exportToPDF: PDF creado con ${pageCount} páginas`);
      } else {
        console.log('📄 exportToPDF: PDF creado con 1 página');
      }
      
      // Generar nombre de archivo con fecha actual si no se proporciona
      const pdfFilename = filename || `Plan_Retiro_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      
      // Guardar PDF
      console.log('📄 exportToPDF: Guardando PDF con nombre:', pdfFilename);
      pdf.save(pdfFilename);
      console.log('📄 exportToPDF: PDF guardado correctamente');
      return true;
    } catch (canvasError) {
      console.error('📄 exportToPDF: Error durante la captura con html2canvas:', canvasError);
      return false;
    }
  } 
  catch (error) {
    console.error('📄 exportToPDF: Error general:', error);
    return false;
  }
} 