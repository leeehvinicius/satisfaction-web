import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { votes, companies } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OperationStatusResponse {
  period: {
    startDate: string;
    endDate: string;
    month: string;
  };
  metrics: {
    totalVotes: number;
    satisfacao: {
      count: number;
      percentage: number;
    };
    melhoria: {
      count: number;
      percentage: number;
    };
  };
}

interface CompanyRankingResponse {
  period: {
    startDate: string;
    endDate: string;
    month: string;
  };
  ranking: Array<{
    position: number;
    companyId: string;
    companyName: string;
    totalVotes: number;
    satisfacao: {
      count: number;
      percentage: number;
    };
    melhoria: {
      count: number;
      percentage: number;
    };
  }>;
}

interface CompleteRankingResponse extends CompanyRankingResponse {
  totalCompanies: number;
}

export default function StatusOperacao() {
  // Initialize with first day of current month and today
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  const handleApplyFilter = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
  };

  const { data: operationStatus, isLoading: isLoadingStatus, error: statusError, refetch: refetchStatus } = useQuery<OperationStatusResponse>({
    queryKey: ['operation-status', startDate, endDate],
    queryFn: () => votes.getOperationStatus(startDate, endDate),
  });

  const { data: completeRanking, isLoading: isLoadingCompleteRanking, error: completeError, refetch: refetchComplete } = useQuery<CompleteRankingResponse>({
    queryKey: ['complete-company-ranking', startDate, endDate],
    queryFn: () => votes.getCompleteCompanyRanking(startDate, endDate),
  });

  const { data: companiesList, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const isLoading = isLoadingStatus || isLoadingCompleteRanking || isLoadingCompanies;
  const hasError = statusError || completeError;
  const refetchAll = () => {
    refetchStatus();
    refetchComplete();
  };

  const { rankingAtingiramMeta, rankingAbaixoMeta, numDiasPeriodo } = useMemo(() => {
    const numDias =
      startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 1;
    const qtPorEmpresa = new Map<string, number>();
    companiesList?.forEach((c) => qtPorEmpresa.set(c.id, Number(c.qt_funcionarios) || 0));

    const atingiram: Array<{
      position: number;
      companyId: string;
      companyName: string;
      totalVotes: number;
      satisfacao: { count: number; percentage: number };
      melhoria: { count: number; percentage: number };
      qtRefeicoesDiarias: number;
      expectedNoPeriodo: number;
      percentualMeta: number;
    }> = [];
    const abaixo: Array<typeof atingiram[0]> = [];

    completeRanking?.ranking?.forEach((company) => {
      const qtDiarias = qtPorEmpresa.get(company.companyId) ?? 0;
      const expectedNoPeriodo = qtDiarias * numDias;
      const minimo30 = 0.3 * expectedNoPeriodo;
      const percentualMeta = expectedNoPeriodo > 0 ? (company.totalVotes / expectedNoPeriodo) * 100 : 0;
      const item = {
        ...company,
        qtRefeicoesDiarias: qtDiarias,
        expectedNoPeriodo,
        percentualMeta,
      };
      if (company.totalVotes >= minimo30) {
        atingiram.push(item);
      } else {
        abaixo.push(item);
      }
    });

    atingiram.sort((a, b) => b.satisfacao.percentage - a.satisfacao.percentage);
    abaixo.sort((a, b) => b.satisfacao.percentage - a.satisfacao.percentage);
    atingiram.forEach((row, i) => {
      row.position = i + 1;
    });
    abaixo.forEach((row, i) => {
      row.position = i + 1;
    });

    return {
      rankingAtingiramMeta: atingiram,
      rankingAbaixoMeta: abaixo,
      numDiasPeriodo: numDias,
    };
  }, [startDate, endDate, companiesList, completeRanking]);

  const renderRankingTable = (
    items: typeof rankingAtingiramMeta,
    emptyMessage: string,
    positionBg: string = 'bg-primary text-primary-foreground'
  ) => {
    if (items.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">{emptyMessage}</div>;
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="p-3 text-left font-semibold">#</th>
              <th className="p-3 text-left font-semibold">Empresa</th>
              <th className="p-3 text-center font-semibold">Meta/dia</th>
              <th className="p-3 text-center font-semibold">Total Votos</th>
              <th className="p-3 text-center font-semibold">% da meta</th>
              <th className="p-3 text-center font-semibold">% Satisfação</th>
              <th className="p-3 text-center font-semibold">% Melhoria</th>
            </tr>
          </thead>
          <tbody>
            {items.map((company) => (
              <tr key={company.companyId} className="border-b border-border hover:bg-accent/50">
                <td className="p-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${positionBg}`}>
                    {company.position}
                  </div>
                </td>
                <td className="p-3 font-medium">{company.companyName}</td>
                <td className="p-3 text-center text-muted-foreground">{company.qtRefeicoesDiarias}</td>
                <td className="p-3 text-center">{company.totalVotes}</td>
                <td className="p-3 text-center">
                  <span className={company.percentualMeta >= 30 ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                    {company.percentualMeta.toFixed(1)}%
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-semibold text-sm">
                      {company.satisfacao.percentage.toFixed(1)}%
                    </div>
                    <span className="text-xs text-muted-foreground">({company.satisfacao.count})</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold text-sm">
                      {company.melhoria.percentage.toFixed(1)}%
                    </div>
                    <span className="text-xs text-muted-foreground">({company.melhoria.count})</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header no estilo Dashboard / Companies */}
          <div
            className={cn(
              'rounded-2xl sm:rounded-3xl p-4 sm:p-6',
              'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent',
              'border border-primary/10 dark:border-primary/20'
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-shrink-0 items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Status da Operação
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Métricas gerais e ranking de satisfação por período.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtro por período */}
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1 space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Calendar className="icon-foreground h-4 w-4 text-foreground" />
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="h-10 w-full"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="flex items-center gap-1 text-sm font-medium text-foreground">
                    <Calendar className="icon-foreground h-4 w-4 text-foreground" />
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="h-10 w-full"
                  />
                </div>
                <Button onClick={handleApplyFilter} className="h-10 w-full md:w-auto">
                  Aplicar Filtro
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Período selecionado: {startDate} até {endDate}
              </p>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">Carregando métricas...</p>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <p className="font-medium text-destructive">Erro ao carregar dados</p>
              <Button variant="outline" onClick={() => refetchAll()} className="mt-4 gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : (
        <div className="space-y-6">

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Votos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{operationStatus?.metrics.totalVotes || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">No mês atual</p>
            </CardContent>
          </Card>

          <Card className="border-border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span>😁</span>
                <span>Satisfação</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                {operationStatus?.metrics.satisfacao.percentage.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {operationStatus?.metrics.satisfacao.count || 0} votos (Ótimo + Bom)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span>😕</span>
                <span>Melhoria</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                {operationStatus?.metrics.melhoria.percentage.toFixed(1) || '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {operationStatus?.metrics.melhoria.count || 0} votos (Regular + Ruim)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ranking principal: empresas com pelo menos 30% da meta diária */}
        <Card className="border-border border-green-200 bg-card dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-xl">🏆 Empresas que atingiram pelo menos 30% da meta diária</CardTitle>
            <p className="text-sm text-muted-foreground">
              Somente empresas que atingiram ou superaram 30% do valor diário de refeições (Qtd Refeições) no período. Ordenado por % de Satisfação.
            </p>
          </CardHeader>
          <CardContent>
            {renderRankingTable(
              rankingAtingiramMeta,
              'Nenhuma empresa atingiu 30% da meta no período selecionado.',
              'bg-primary text-primary-foreground'
            )}
          </CardContent>
        </Card>

        {/* Lista: empresas abaixo de 30% da meta diária */}
        <Card className="border-border border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="text-xl">⚠️ Empresas abaixo de 30% da meta diária</CardTitle>
            <p className="text-sm text-muted-foreground">
              Empresas que ainda não alcançaram 30% do valor diário de refeições no período. Ordenado por % de Satisfação.
            </p>
          </CardHeader>
          <CardContent>
            {renderRankingTable(
              rankingAbaixoMeta,
              'Nenhuma empresa abaixo da meta no período.',
              'bg-amber-500 text-white dark:bg-amber-600'
            )}
          </CardContent>
        </Card>
        </div>
          )}
        </div>
      </div>
    </div>
  );
}
