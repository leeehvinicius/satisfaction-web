import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

type ExportPDFProps = {
  contentRef: React.RefObject<HTMLElement>;
  fileName?: string;
  title?: string;
  subtitle?: string;
  endMarkerId?: string; // onde parar (default: pdf-end-marker)
};

export function ExportPDF({
  contentRef,
  fileName = 'relatorio.pdf',
  title = 'Relatório de Satisfação',
  subtitle = 'Análise de Avaliações',
  endMarkerId = 'pdf-end-marker',
}: ExportPDFProps) {
  const [loading, setLoading] = useState(false);

  const waitNextFrame = () =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

  // aplica estilos temporários (fundo branco, remove sombras/sticky/fixed)
  function withExportStyles(target: HTMLElement) {
    const style = document.createElement('style');
    style.setAttribute('data-pdf-export-style', 'true');
    style.textContent = `
      .pdf-exporting, .pdf-exporting * {
        background: #fff !important;
        box-shadow: none !important;
        filter: none !important;
        outline: none !important;
      }
      .pdf-exporting * {
        position: static !important;
        transform: none !important;
        backdrop-filter: none !important;
      }
      .pdf-exporting { overflow: hidden !important; }
      .pdf-exporting [class*="ring"],
      .pdf-exporting .shadow,
      .pdf-exporting [class*="shadow"] { box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    const prevBg = target.style.backgroundColor;
    target.classList.add('pdf-exporting');
    target.style.backgroundColor = '#fff';

    return () => {
      target.classList.remove('pdf-exporting');
      target.style.backgroundColor = prevBg;
      style.remove();
    };
  }

  // coleta quebras manuais em coordenadas CSS (px) relativas ao topo do content
  function getManualBreaksCss(container: HTMLElement): number[] {
    const rect = container.getBoundingClientRect();
    const els = Array.from(
      container.querySelectorAll<HTMLElement>('[data-pdf-break], .pdf-break')
    );
    const ys = els.map((el) => {
      const r = el.getBoundingClientRect();
      // posicao vertical relativa ao container + scroll interno, em CSS px
      return r.top - rect.top + container.scrollTop;
    });
    // remove duplicados e ordena
    const uniq = Array.from(new Set(ys.map((n) => Math.max(0, Math.floor(n)))));
    uniq.sort((a, b) => a - b);
    return uniq;
  }

  // captura uma fatia (chunk) do conteúdo em CSS px
  const captureChunk = async (
    target: HTMLElement,
    yCssStart: number,
    cssHeight: number,
    scale: number
  ) => {
    return html2canvas(target, {
      scale,
      useCORS: true,
      backgroundColor: '#fff',
      logging: false,
      windowWidth: document.documentElement.scrollWidth,
      windowHeight: document.documentElement.scrollHeight,
      // delimitação da área a rasterizar
      y: yCssStart,
      height: cssHeight,
      scrollX: 0,
      scrollY: -target.scrollTop,
      removeContainer: true,
      foreignObjectRendering: false,
    });
  };

  const handleExport = async () => {
    if (!contentRef.current) return;
    setLoading(true);

    try {
      await waitNextFrame();

      const contentEl = contentRef.current;
      const cleanup = withExportStyles(contentEl); // estilos limpos

      // === parâmetros do PDF ===
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidthMM = 210;
      const pageHeightMM = 297;
      const marginMM = 10;
      const headerMM = 30;
      const footerMM = 10;
      const usableWidthMM = pageWidthMM - marginMM * 2;
      const usableHeightMM = pageHeightMM - marginMM * 2 - headerMM - footerMM;

      // DPR mais baixo ajuda a não estourar limites
      const scale = Math.min(1.5, window.devicePixelRatio || 1.5);

      // Altura efetiva até o marcador (se existir)
      const rect = contentEl.getBoundingClientRect();
      const totalCssHeight = (() => {
        const marker = contentEl.querySelector<HTMLElement>(`#${endMarkerId}`);
        if (!marker) return Math.max(contentEl.scrollHeight, rect.height);
        const bottomCss =
          marker.getBoundingClientRect().bottom - rect.top + contentEl.scrollTop;
        return Math.max(0, Math.floor(bottomCss));
      })();

      // Quebras manuais (coordenadas CSS)
      const manualBreaksCss = getManualBreaksCss(contentEl).filter(
        (y) => y > 0 && y < totalCssHeight
      );

      // helper: px por mm para cada canvas (usando largura como referência)
      const getPxPerMM = (canvasWidthPx: number) => canvasWidthPx / usableWidthMM;

      // Altura (em CSS px) por chunk — ajuste se necessário
      const CHUNK_CSS_HEIGHT = 5000;

      let renderedPages = 0;

      for (let yCss = 0; yCss < totalCssHeight; yCss += CHUNK_CSS_HEIGHT) {
        const chunkCssHeight = Math.min(CHUNK_CSS_HEIGHT, totalCssHeight - yCss);
        const chunkCanvas = await captureChunk(contentEl, yCss, chunkCssHeight, scale);

        const pxPerMM = getPxPerMM(chunkCanvas.width);
        const pageHeightPx = Math.floor(usableHeightMM * pxPerMM);

        // mapeia quebras manuais deste chunk para coordenadas em PX do canvas do chunk
        const scaleY = chunkCanvas.height / chunkCssHeight; // css px -> canvas px
        const breaksPxInChunk = manualBreaksCss
          .map((bCss) => bCss - yCss)
          .filter((relCss) => relCss > 0 && relCss < chunkCssHeight)
          .map((relCss) => Math.floor(relCss * scaleY))
          .sort((a, b) => a - b);

        let breakIdx = 0;
        const TOL = 2; // px — evita páginas zeradas por arredondamento

        // fatiar o chunk em páginas do PDF
        for (let yPx = 0; yPx < chunkCanvas.height; ) {
          // encontra o próximo break > yPx
          while (breakIdx < breaksPxInChunk.length && breaksPxInChunk[breakIdx] <= yPx + TOL) {
            breakIdx++;
          }
          const nextManualBreakPx = breaksPxInChunk[breakIdx] ?? Infinity;

          const naturalEnd = yPx + pageHeightPx;
          const pageEndPx = Math.min(naturalEnd, nextManualBreakPx, chunkCanvas.height);
          let sliceHeightPx = Math.max(0, pageEndPx - yPx);

          // guarda contra fatia vazia (ex.: break colado)
          if (sliceHeightPx <= 0) {
            yPx = Math.min(naturalEnd, chunkCanvas.height);
            continue;
          }

          // render da fatia da página
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = chunkCanvas.width;
          pageCanvas.height = sliceHeightPx;

          const ctx = pageCanvas.getContext('2d');
          if (!ctx) break;

          ctx.drawImage(
            chunkCanvas,
            0, yPx, pageCanvas.width, pageCanvas.height,
            0, 0, pageCanvas.width, pageCanvas.height
          );

          const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);
          const imgHeightMM = sliceHeightPx / pxPerMM;

          if (renderedPages > 0) pdf.addPage();

          const pageIndex = renderedPages + 1;

          // Header apenas na primeira página
          if (pageIndex === 1) {
            pdf.setFontSize(24);
            pdf.text(title, pageWidthMM / 2, marginMM + 10, { align: 'center' });
            pdf.setFontSize(16);
            pdf.text(subtitle, pageWidthMM / 2, marginMM + 18, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text(
              `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`,
              pageWidthMM / 2,
              marginMM + 26,
              { align: 'center' }
            );
          }

          const startYMM = marginMM + (pageIndex === 1 ? headerMM : 0);

          pdf.addImage(
            imgData,
            'JPEG',
            marginMM,
            startYMM,
            usableWidthMM,
            imgHeightMM,
            undefined,
            'FAST'
          );

          // Footer em todas as páginas
          pdf.setFontSize(10);
          pdf.text(
            `Página ${pageIndex}`,
            pageWidthMM / 2,
            pageHeightMM - marginMM,
            { align: 'center' }
          );

          renderedPages++;
          yPx += sliceHeightPx;
        }
      }

      cleanup(); // restaura estilos
      pdf.save(fileName);
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Mantém seu seletor de quebra manual */}
      <style>{`
        .pdf-break { height: 0; }
      `}</style>

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

      {/* Exemplo de uso da quebra manual:
          <div className="pdf-break" />
          ou <div data-pdf-break />
      */}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span>Gerando PDF, aguarde...</span>
          </div>
        </div>
      )}
    </>
  );
}
