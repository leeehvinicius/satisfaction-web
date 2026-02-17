import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface SafeChartProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const SafeChart: React.FC<SafeChartProps> = ({ children, fallback }) => {
  return (
    <div translate="no" className="w-full h-full">
      <ErrorBoundary
        fallback={
          fallback || (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto" />
                <p className="text-sm">Erro ao carregar gráfico</p>
              </div>
            </div>
          )
        }
      >
        {children}
      </ErrorBoundary>
    </div>
  );
};
