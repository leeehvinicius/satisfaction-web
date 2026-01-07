import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export function ExportPDF({ contentRef, fileName = 'relatorio.pdf', title = 'Relatório de Satisfação', subtitle = 'Análise de Avaliações' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!contentRef.current) return;

    setLoading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;

      // Add header
      pdf.setFontSize(24);
      pdf.text(title, pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(subtitle, pageWidth / 2, 30, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });

      // Get the content to export
      const content = contentRef.current;

      // Find specific sections to export
      const sections = [
        // Header section
        content.querySelector('.mb-6'),
        // Total Votes and Satisfaction Rate cards
        content.querySelector('.grid-cols-1.md\\:grid-cols-2'),
        // Daily Research chart
        content.querySelector('.border-2:nth-of-type(1)'),
        // Daily Results table
        content.querySelector('.border-2:nth-of-type(2)'),
        // Distribution of Ratings chart
        content.querySelector('.border-2:nth-of-type(3)'),
        // Daily Results by service type cards
        content.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3')
      ].filter(Boolean);

      let currentY = 50; // Start after header

      for (const section of sections) {
        if (!section) continue;

        const canvas = await html2canvas(section as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#fff',
          logging: false,
        });

        const imgProps = { width: canvas.width, height: canvas.height };
        const pdfImgWidth = pageWidth - margin * 2;
        const pdfImgHeight = (canvas.height * pdfImgWidth) / canvas.width;

        // Check if we need a new page
        if (currentY + pdfImgHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }

        // Add the section to the PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, currentY, pdfImgWidth, pdfImgHeight);
        
        // Add page number
        pdf.setFontSize(10);
        const pageNumber = pdf.getCurrentPageInfo().pageNumber;
        pdf.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - margin, { align: 'center' });

        currentY += pdfImgHeight + 10; // Add some spacing between sections
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    }

    setLoading(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
        disabled={loading}
      >
        <Download className="h-4 w-4" />
        {loading ? 'Gerando PDF...' : 'Exportar PDF'}
      </Button>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span>Gerando PDF, aguarde...</span>
          </div>
        </div>
      )}
    </>
  );
}