import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DetailedReportProps {
  dailyData: Array<{
    data: string;
    empresa: string;
    otimo: number;
    bom: number;
    regular: number;
    ruim: number;
    total: number;
  }>;
  negativeResponses: Array<{
    data: string;
    empresa: string;
    voto: string;
    servico: string;
    comentario: string;
  }>;
  fileName?: string;
  companyName?: string;
}

export function ExportDetailedReport({ 
  dailyData, 
  negativeResponses, 
  fileName = 'relatorio-detalhado.pdf',
  companyName = 'Empresa'
}: DetailedReportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 10;

      // Add header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('Relatório Detalhado por Dia', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(companyName, pageWidth / 2, 30, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 40, { align: 'center' });

      // Add daily data table
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Relatório Detalhado por Dia', margin, 50);

      const dailyTableData = dailyData.map(row => [
        row.data,
        row.empresa,
        `${row.otimo} (Ótimo)`,
        `${row.bom} (Bom)`,
        `${row.regular} (Regular)`,
        `${row.ruim} (Ruim)`,
        row.total.toString()
      ]);

      autoTable(pdf, {
        startY: 55,
        head: [['Data', 'Empresa', 'Ótimo', 'Bom', 'Regular', 'Ruim', 'Total']],
        body: dailyTableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          font: 'helvetica',
          fontSize: 9, 
          cellPadding: 2 
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 20 }
        }
      });

      // Add negative responses table
      const lastTableEnd = (pdf as any).lastAutoTable.finalY;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Relatório de Respostas Negativas', margin, lastTableEnd + 15);

      const negativeTableData = negativeResponses.map(row => [
        row.data,
        row.empresa,
        row.voto.replace('😐', '(Regular)').replace('😞', '(Ruim)'),
        row.servico,
        row.comentario
      ]);

      autoTable(pdf, {
        startY: lastTableEnd + 20,
        head: [['Data', 'Empresa', 'Voto', 'Serviço', 'Comentário']],
        body: negativeTableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [41, 128, 185], 
          textColor: 255,
          font: 'helvetica',
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { 
          font: 'helvetica',
          fontSize: 9, 
          cellPadding: 2 
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 30 },
          2: { cellWidth: 25 },
          3: { cellWidth: 40 },
          4: { cellWidth: 50 }
        }
      });

      // Add page numbers
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao exportar relatório detalhado:', error);
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
        <Calendar className="h-4 w-4" />
        {loading ? 'Gerando Relatório...' : 'Relatório Detalhado por Dia'}
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
            <span>Gerando relatório, aguarde...</span>
          </div>
        </div>
      )}
    </>
  );
} 