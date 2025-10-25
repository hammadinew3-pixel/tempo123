import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generate a PDF from an HTML element with cross-browser compatibility
 * Works on Firefox, Chrome, and Safari
 * @param element - The HTML element to convert to PDF
 * @param filename - The name of the PDF file (without .pdf extension)
 */
export const generatePDFFromElement = async (
  element: HTMLElement,
  filename: string
): Promise<void> => {
  try {
    // 1. Wait for fonts to be ready
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // 2. Force crossOrigin on all images
    const images = Array.from(element.querySelectorAll('img'));
    images.forEach(img => {
      if (!img.getAttribute('crossorigin')) {
        img.setAttribute('crossorigin', 'anonymous');
      }
    });

    // 3. Wait for all images to load
    await Promise.all(
      images.map(
        img =>
          new Promise<void>(resolve => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              const onLoad = () => {
                resolve();
              };
              img.addEventListener('load', onLoad, { once: true });
              img.addEventListener('error', onLoad, { once: true });
            }
          })
      )
    );

    // 4. Small delay for Chrome to stabilize rendering
    await new Promise(resolve => setTimeout(resolve, 300));

    // 5. Capture with html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');

    // 6. Create PDF with jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // 7. Download using blob and temporary link (Firefox compatible)
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();

    // 8. Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
