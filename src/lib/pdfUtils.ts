import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generate PDF from HTML element using html2canvas + jsPDF
 * Optimized for Chrome compatibility with proper image/font loading
 * @param element - The HTML element to convert to PDF
 * @param filename - The name of the PDF file
 * @returns Promise that resolves when PDF is generated
 */
export const generatePDFFromElement = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    // Wait for images and fonts to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate canvas from element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
    });
    
    // Get image data from canvas
    const imgData = canvas.toDataURL("image/png");
    
    // Create PDF
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    // Save PDF
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
