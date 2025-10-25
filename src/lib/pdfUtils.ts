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
    // 1. Polices
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    // 2. Images: forcer CORS et attendre le chargement
    const images = Array.from(element.querySelectorAll('img'));
    for (const img of images) {
      try {
        if (!img.getAttribute('crossorigin')) {
          img.setAttribute('crossorigin', 'anonymous');
        }
      } catch {}
    }
    await Promise.all(
      images.map(img => new Promise<void>((resolve) => {
        if (img.complete && img.naturalWidth > 0) return resolve();
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }))
    );

    // 3. Stabiliser le DOM (Chrome/Firefox)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise(resolve => setTimeout(resolve, 300));

    // 4. Capture avec html2canvas
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
    try { imgData = canvas.toDataURL('image/png'); } catch { imgData = ''; }

    // 5. Retry si canvas vide
    if (!imgData || imgData === 'data:,') {
      await new Promise(resolve => setTimeout(resolve, 600));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      canvas = await takeCanvas();
      try { imgData = canvas.toDataURL('image/png'); } catch { imgData = ''; }
      if (!imgData || imgData === 'data:,') {
        throw new Error('La capture du contenu a échoué (canvas vide).');
      }
    }

    // 6. PDF via jsPDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

    // 7. Blob + téléchargement cross-navigateurs
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

    // 7a. Notifier la fenêtre parente (si en iframe) avec le blob
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'pdf-ready', filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`, blob }, '*');
      }
    } catch {}

    // 7b. Fallback: forcer le téléchargement dans le document courant
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();

    // 7c. Signaler fin de download au parent
    try {
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'pdf-download-complete' }, '*');
      }
    } catch {}

    // 8. Nettoyage
    setTimeout(() => {
      try { document.body.removeChild(link); } catch {}
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
