import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { votes } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar } from 'lucide-react';

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

  const { data: operationStatus, isLoading: isLoadingStatus } = useQuery<OperationStatusResponse>({
    queryKey: ['operation-status', startDate, endDate],
    queryFn: () => votes.getOperationStatus(startDate, endDate),
  });

  const { data: companyRanking, isLoading: isLoadingRanking } = useQuery<CompanyRankingResponse>({
    queryKey: ['company-ranking', startDate, endDate],
    queryFn: () => votes.getCompanyRanking(startDate, endDate, undefined, 5),
  });

  const { data: worstCompanyRanking, isLoading: isLoadingWorstRanking } = useQuery<CompanyRankingResponse>({
    queryKey: ['worst-company-ranking', startDate, endDate],
    queryFn: () => votes.getWorstCompanyRanking(startDate, endDate, undefined, 5),
  });

  const { data: completeRanking, isLoading: isLoadingCompleteRanking } = useQuery<CompleteRankingResponse>({
    queryKey: ['complete-company-ranking', startDate, endDate],
    queryFn: () => votes.getCompleteCompanyRanking(startDate, endDate),
  });

  if (isLoadingStatus || isLoadingRanking || isLoadingWorstRanking || isLoadingCompleteRanking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 pb-10 space-y-6">
        {/* Header with Date Filters */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Status da Operação</h1>

          {/* Date Range Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button onClick={handleApplyFilter} className="w-full md:w-auto">
                  Aplicar Filtro
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-4">
                Período selecionado: {startDate} até {endDate}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
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

          <Card className="border-green-200 bg-green-50 dark:bg-green-950">
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

          <Card className="border-red-200 bg-red-50 dark:bg-red-950">
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

        {/* Ranking de Empresas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">🏆 Top 5 Empresas - Ranking de Satisfação</CardTitle>
            <p className="text-sm text-muted-foreground">
              Empresas ordenadas por % de Satisfação (Ótimo + Bom)
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Empresa</th>
                    <th className="text-center p-3 font-semibold">Total Votos</th>
                    <th className="text-center p-3 font-semibold">% Satisfação</th>
                    <th className="text-center p-3 font-semibold">% Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  {companyRanking?.ranking.map((company) => (
                    <tr key={company.companyId} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                          {company.position}
                        </div>
                      </td>
                      <td className="p-3 font-medium">{company.companyName}</td>
                      <td className="p-3 text-center">{company.totalVotes}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-semibold">
                            {company.satisfacao.percentage.toFixed(1)}%
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({company.satisfacao.count})
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold">
                            {company.melhoria.percentage.toFixed(1)}%
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({company.melhoria.count})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!companyRanking?.ranking || companyRanking.ranking.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Piores Empresas */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-xl">⚠️ 5 Piores Empresas - Necessitam Atenção</CardTitle>
            <p className="text-sm text-muted-foreground">
              Empresas com menor % de Satisfação (ordenadas da pior para melhor)
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Empresa</th>
                    <th className="text-center p-3 font-semibold">Total Votos</th>
                    <th className="text-center p-3 font-semibold">% Satisfação</th>
                    <th className="text-center p-3 font-semibold">% Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  {worstCompanyRanking?.ranking.map((company) => (
                    <tr key={company.companyId} className="border-b hover:bg-accent/50">
                      <td className="p-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold">
                          {company.position}
                        </div>
                      </td>
                      <td className="p-3 font-medium">{company.companyName}</td>
                      <td className="p-3 text-center">{company.totalVotes}</td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full font-semibold">
                            {company.satisfacao.percentage.toFixed(1)}%
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({company.satisfacao.count})
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full font-semibold">
                            {company.melhoria.percentage.toFixed(1)}%
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({company.melhoria.count})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(!worstCompanyRanking?.ranking || worstCompanyRanking.ranking.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking Completo de Todas as Empresas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">📊 Ranking Geral Completo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Todas as empresas ordenadas por % de Satisfação ({completeRanking?.totalCompanies || 0} empresas)
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">#</th>
                    <th className="text-left p-3 font-semibold">Empresa</th>
                    <th className="text-center p-3 font-semibold">Total Votos</th>
                    <th className="text-center p-3 font-semibold">% Satisfação</th>
                    <th className="text-center p-3 font-semibold">% Melhoria</th>
                  </tr>
                </thead>
                <tbody>
                  {completeRanking?.ranking.map((company) => {
                    // Determine color based on position
                    const isTop5 = company.position <= 5;
                    const isBottom5 = company.position > (completeRanking.totalCompanies - 5);

                    return (
                      <tr
                        key={company.companyId}
                        className={`border-b hover:bg-accent/50 ${isTop5 ? 'bg-green-50 dark:bg-green-950/20' :
                          isBottom5 ? 'bg-red-50 dark:bg-red-950/20' : ''
                          }`}
                      >
                        <td className="p-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${isTop5 ? 'bg-green-500 text-white' :
                            isBottom5 ? 'bg-red-500 text-white' :
                              'bg-muted text-foreground'
                            }`}>
                            {company.position}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{company.companyName}</td>
                        <td className="p-3 text-center">{company.totalVotes}</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full font-semibold ${company.satisfacao.percentage >= 80 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                              company.satisfacao.percentage >= 60 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}>
                              {company.satisfacao.percentage.toFixed(1)}%
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({company.satisfacao.count})
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-2">
                            <div className="bg-muted text-muted-foreground px-3 py-1 rounded-full font-semibold">
                              {company.melhoria.percentage.toFixed(1)}%
                            </div>
                            <span className="text-xs text-muted-foreground">
                              ({company.melhoria.count})
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(!completeRanking?.ranking || completeRanking.ranking.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
