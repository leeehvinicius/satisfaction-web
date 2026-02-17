import { useEffect } from 'react';
import { toast } from 'sonner';

export const useTranslationDetector = () => {
  useEffect(() => {
    let hasShownWarning = false;

    const observer = new MutationObserver((mutations) => {
      if (hasShownWarning) return;

      const hasTranslation = mutations.some(mutation => {
        // Google Translate adiciona elementos <font>
        if (mutation.target.nodeName === 'FONT') return true;

        // Verifica nós adicionados
        return Array.from(mutation.addedNodes).some(
          (node: any) => node.nodeName === 'FONT'
        );
      });

      if (hasTranslation) {
        hasShownWarning = true;
        toast.info(
          'Tradução detectada. Se encontrar problemas, recarregue a página.',
          { duration: 5000 }
        );
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    return () => observer.disconnect();
  }, []);
};
