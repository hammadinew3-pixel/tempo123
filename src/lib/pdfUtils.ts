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
    // 1) Wait for fonts to be ready
    try {
      await (document.fonts?.ready ?? Promise.resolve());
    } catch (e) {
      console.warn('Font loading check failed:', e);
    }

    // 2) Force CORS on all images and wait for them to load
    const imgs = Array.from(element.querySelectorAll('img'));
    for (const img of imgs) {
      try {
        if (!img.getAttribute('crossorigin')) {
          img.setAttribute('crossorigin', 'anonymous');
        }
      } catch (e) {
        console.warn('Failed to set crossorigin on image:', e);
      }
    }
    
    await Promise.all(
      imgs.map(img => new Promise<void>(resolve => {
        if (img.complete && img.naturalWidth > 0) {
          return resolve();
        }
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }))
    );

    // 3) Let DOM stabilize (double frame) + minimum delay
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(resolve => setTimeout(resolve, 500));

    // 4) Capture with html2canvas (CORS + white background + controlled scale)
    const takeCanvas = async () => html2canvas(element, {
      scale: Math.min(2, window.devicePixelRatio || 1),
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 5000,
      removeContainer: true,
    });

    let canvas = await takeCanvas();
    let imgData = '';
    try {
      imgData = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('First toDataURL failed:', e);
      imgData = '';
    }

    // 5) Single retry if empty
    if (!imgData || imgData === 'data:,' || imgData.length < 100) {
      console.warn('Canvas was empty, retrying...');
      await new Promise(resolve => setTimeout(resolve, 600));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      canvas = await takeCanvas();
      try {
        imgData = canvas.toDataURL('image/png');
      } catch (e) {
        console.error('Second toDataURL failed:', e);
        imgData = '';
      }
    }

    if (!imgData || imgData === 'data:,' || imgData.length < 100) {
      throw new Error('La capture du contenu a échoué (canvas vide).');
    }

    // 6) Generate PDF with jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
