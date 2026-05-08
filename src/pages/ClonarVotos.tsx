import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { votes, companies } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays } from 'date-fns';

export default function ClonarVotos() {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [leftFrom, setLeftFrom] = useState('');
  const [leftTo, setLeftTo] = useState('');
  const [rightFrom, setRightFrom] = useState('');
  const [rightTo, setRightTo] = useState('');

  const { data: companiesList } = useQuery({
    queryKey: ['companies-mine'],
    queryFn: companies.getMine,
  });

  const filteredCompanies = React.useMemo(() => {
    if (!companiesList) return [];
    return companiesList.filter((c) =>
      c.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companiesList, searchQuery]);

  const { data: leftAnalytics, isLoading: leftLoading } = useQuery({
    queryKey: ['clonar-votos-left', selectedCompany, leftFrom, leftTo],
    queryFn: () =>
      votes.getAnalyticsRelatorio(selectedCompany, {
        startDate: leftFrom,
        endDate: leftTo,
      }),
    enabled: !!selectedCompany && !!leftFrom && !!leftTo,
  });

  const { data: rightAnalytics, isLoading: rightLoading } = useQuery({
    queryKey: ['clonar-votos-right', selectedCompany, rightFrom, rightTo],
    queryFn: () =>
      votes.getAnalyticsRelatorio(selectedCompany, {
        startDate: rightFrom,
        endDate: rightTo,
      }),
    enabled: !!selectedCompany && !!rightFrom && !!rightTo,
  });

  const empresaSelecionada = companiesList?.find((c) => c.id === selectedCompany);
  const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

  const buildFullDayRange = (from: string, to: string, apiDays: any[]) => {
    const result: any[] = [];
    const start = parseISO(from);
    const end = parseISO(to);
    const map = new Map(apiDays.map((d) => [d.data, d]));
    let current = start;
    while (current <= end) {
      const key = format(current, 'yyyy-MM-dd');
      result.push(map.get(key) ?? { data: key, Ótimo: 0, Bom: 0, Regular: 0, Ruim: 0, total: 0 });
      current = addDays(current, 1);
    }
    return result;
  };

  const renderTable = (analytics: any, isLoading: boolean, from: string, to: string) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Selecione um período para visualizar os votos.
        </div>
      );
    }

    const votosPorDia: any[] = from && to
      ? buildFullDayRange(from, to, analytics.votesByDay || [])
      : analytics.votesByDay || [];

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-200">Data</th>
              <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">😊 Ótimo</th>
              <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">🙂 Bom</th>
              <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">😐 Regular</th>
              {!deveOcultarRuim && (
                <th className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">😞 Ruim</th>
              )}
              <th className="px-3 py-2 text-center font-bold text-gray-700 dark:text-gray-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {votosPorDia.length === 0 ? (
              <tr>
                <td
                  colSpan={deveOcultarRuim ? 5 : 6}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  Nenhum voto encontrado neste período.
                </td>
              </tr>
            ) : (
              votosPorDia.map((day: any, index: number) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0
                      ? 'bg-white dark:bg-transparent'
                      : 'bg-gray-50 dark:bg-neutral-900/30'
                  }
                >
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                    {format(parseISO(day.data), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                    {day.Ótimo || 0}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                    {day.Bom || 0}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                    {day.Regular || 0}
                  </td>
                  {!deveOcultarRuim && (
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                      {day.Ruim || 0}
                    </td>
                  )}
                  <td className="px-3 py-2 text-center font-bold text-gray-700 dark:text-gray-300">
                    {day.total || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header */}
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
                  <Copy className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Clonar Votos
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {selectedCompany
                      ? `Comparando períodos de ${empresaSelecionada?.nome}`
                      : 'Selecione uma empresa para comparar dois períodos de votos.'}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto sm:min-w-[220px]">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="h-10 w-full justify-between sm:w-auto sm:min-w-[220px]"
                    >
                      <span className="truncate">
                        {selectedCompany
                          ? companiesList?.find((c) => c.id === selectedCompany)?.nome
                          : 'Selecione uma empresa'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[min(100vw-2rem,250px)] border-border bg-card p-0"
                    align="start"
                  >
                    <div className="rounded-lg border border-border">
                      <div className="flex items-center border-b border-border px-3">
                        <input
                          className="h-9 w-full flex-1 border-none bg-transparent outline-none placeholder:text-muted-foreground"
                          placeholder="Buscar empresa..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="max-h-[300px] overflow-auto">
                        {filteredCompanies.length === 0 ? (
                          <div className="py-6 text-center text-sm text-muted-foreground">
                            Nenhuma empresa encontrada.
                          </div>
                        ) : (
                          filteredCompanies.map((company) => (
                            <div
                              key={company.id}
                              className={cn(
                                'flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-muted/50',
                                selectedCompany === company.id && 'bg-muted/50'
                              )}
                              onClick={() => {
                                setSelectedCompany(company.id);
                                setOpen(false);
                                setSearchQuery('');
                              }}
                            >
                              <Check
                                className={cn(
                                  'h-4 w-4 text-primary',
                                  selectedCompany === company.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="flex-1 truncate">{company.nome}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Content */}
          {!selectedCompany ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <Copy className="mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="text-lg font-medium">Selecione uma empresa</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Escolha uma empresa acima para comparar dois períodos de votos lado a lado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Período A */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Período A</CardTitle>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs text-muted-foreground">De</label>
                      <Input
                        type="date"
                        value={leftFrom}
                        onChange={(e) => setLeftFrom(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs text-muted-foreground">Até</label>
                      <Input
                        type="date"
                        value={leftTo}
                        onChange={(e) => setLeftTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderTable(leftAnalytics, leftLoading, leftFrom, leftTo)}
                </CardContent>
              </Card>

              {/* Período B */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Período B</CardTitle>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs text-muted-foreground">De</label>
                      <Input
                        type="date"
                        value={rightFrom}
                        onChange={(e) => setRightFrom(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs text-muted-foreground">Até</label>
                      <Input
                        type="date"
                        value={rightTo}
                        onChange={(e) => setRightTo(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderTable(rightAnalytics, rightLoading, rightFrom, rightTo)}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
