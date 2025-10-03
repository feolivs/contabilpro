import { pdfjs } from 'react-pdf'

// Configurar worker do PDF.js apenas no cliente
export function configurePdfWorker() {
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    // Usar CDN confiável do Cloudflare
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
  }
}
