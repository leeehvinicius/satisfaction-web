import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { votes, companies } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, CheckCircle2, ChevronsUpDown, Copy, ArrowRight, Sparkles, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayData {
  data: string;
  Ótimo: number;
  Bom: number;
  Regular: number;
  Ruim: number;
  total: number;
}

/** Dia da semana por extenso em pt-BR (ex.: Segunda-feira). */
function formatWeekdayLongPt(isoDate: string): string {
  const raw = format(parseISO(isoDate), 'EEEE', { locale: ptBR });
  return raw.charAt(0).toLocaleUpperCase('pt-BR') + raw.slice(1);
}

type TransferPhase = 'idle' | 'running' | 'success' | 'error';

function cloneErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
    return err.message || 'Falha ao clonar votos.';
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao clonar votos.';
}

export default function ClonarVotos() {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [leftFrom, setLeftFrom] = useState('');
  const [leftTo, setLeftTo] = useState('');
  const [rightFrom, setRightFrom] = useState('');
  const [rightTo, setRightTo] = useState('');

  const draggedDay = useRef<DayData | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [cloneConfirm, setCloneConfirm] = useState<{ source: DayData; target: DayData } | null>(null);
  const [selectedSourceDay, setSelectedSourceDay] = useState<DayData | null>(null);
  const [selectedTargetDay, setSelectedTargetDay] = useState<DayData | null>(null);
  const [transferPhase, setTransferPhase] = useState<TransferPhase>('idle');
  const [lastClonedCount, setLastClonedCount] = useState<number | null>(null);

  const cloneMutation = useMutation({
    mutationFn: votes.cloneDay,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['clonar-votos-left'] });
      void queryClient.invalidateQueries({ queryKey: ['clonar-votos-right'] });
      setLastClonedCount(data.cloned);
      setTransferPhase('success');
      if (data.cloned === 0) {
        toast.info('Nenhum voto ativo no dia de origem', {
          description: 'Nada foi copiado. Verifique se há votos na data de origem.',
        });
      } else {
        toast.success(`${data.cloned} voto(s) transferidos para o dia de destino.`);
      }
      window.setTimeout(() => {
        setTransferPhase('idle');
        setLastClonedCount(null);
      }, 2600);
    },
    onError: (err) => {
      toast.error(cloneErrorMessage(err));
      setTransferPhase('error');
      window.setTimeout(() => setTransferPhase('idle'), 1700);
    },
  });

  const periodosDefinidos =
    !!selectedCompany && !!leftFrom && !!leftTo && !!rightFrom && !!rightTo;

  useEffect(() => {
    setSelectedSourceDay(null);
  }, [leftFrom, leftTo]);

  useEffect(() => {
    setSelectedTargetDay(null);
  }, [rightFrom, rightTo]);

  useEffect(() => {
    setSelectedSourceDay(null);
    setSelectedTargetDay(null);
  }, [selectedCompany]);

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
      votes.getAnalyticsRelatorio(selectedCompany, { startDate: leftFrom, endDate: leftTo }),
    enabled: !!selectedCompany && !!leftFrom && !!leftTo,
  });

  const { data: rightAnalytics, isLoading: rightLoading } = useQuery({
    queryKey: ['clonar-votos-right', selectedCompany, rightFrom, rightTo],
    queryFn: () =>
      votes.getAnalyticsRelatorio(selectedCompany, { startDate: rightFrom, endDate: rightTo }),
    enabled: !!selectedCompany && !!rightFrom && !!rightTo,
  });

  const empresaSelecionada = companiesList?.find((c) => c.id === selectedCompany);
  const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

  const buildFullDayRange = (from: string, to: string, apiDays: DayData[]): DayData[] => {
    const result: DayData[] = [];
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

  const renderTable = (
    analytics: any,
    isLoading: boolean,
    from: string,
    to: string,
    role: 'source' | 'target',
    selectedDateKey: string | null,
    onSelectDay: (day: DayData) => void
  ) => {
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

    const votosPorDia: DayData[] =
      from && to
        ? buildFullDayRange(from, to, analytics.votesByDay || [])
        : analytics.votesByDay || [];

    return (
      <div className="overflow-x-auto">
        {role === 'source' && (
          <p className="mb-2 text-xs text-muted-foreground">
            Clique em um dia para selecionar a origem, ou arraste-o para o Período B.
          </p>
        )}
        {role === 'target' && (
          <p className="mb-2 text-xs text-muted-foreground">
            Clique em um dia para selecionar o destino, ou solte aqui o dia arrastado do Período A.
          </p>
        )}
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-200">Data</th>
              <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-200">Semana</th>
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
                  colSpan={deveOcultarRuim ? 6 : 7}
                  className="px-3 py-4 text-center text-muted-foreground"
                >
                  Nenhum voto encontrado neste período.
                </td>
              </tr>
            ) : (
              votosPorDia.map((day, index) => {
                const isDropTarget = role === 'target' && dragOverDate === day.data;
                const isRowSelected = selectedDateKey === day.data;
                return (
                  <tr
                    key={day.data}
                    draggable={role === 'source'}
                    onClick={() => onSelectDay(day)}
                    onDragStart={
                      role === 'source'
                        ? () => { draggedDay.current = day; }
                        : undefined
                    }
                    onDragOver={
                      role === 'target'
                        ? (e) => { e.preventDefault(); setDragOverDate(day.data); }
                        : undefined
                    }
                    onDragLeave={
                      role === 'target'
                        ? () => setDragOverDate(null)
                        : undefined
                    }
                    onDrop={
                      role === 'target'
                        ? (e) => {
                            e.preventDefault();
                            setDragOverDate(null);
                            if (draggedDay.current) {
                              setCloneConfirm({ source: draggedDay.current, target: day });
                              draggedDay.current = null;
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'transition-colors',
                      role === 'source' && 'cursor-grab active:cursor-grabbing',
                      isDropTarget
                        ? 'bg-primary/10 outline outline-2 outline-primary/50'
                        : isRowSelected
                          ? 'bg-primary/15 outline outline-2 outline-primary/40'
                          : index % 2 === 0
                            ? 'bg-white dark:bg-transparent'
                            : 'bg-gray-50 dark:bg-neutral-900/30',
                      role === 'source' && 'hover:bg-blue-50 dark:hover:bg-blue-950/20',
                      (role === 'target' || role === 'source') && 'cursor-pointer'
                    )}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {format(parseISO(day.data), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-left text-gray-700 dark:text-gray-300">
                      {formatWeekdayLongPt(day.data)}
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const formatDate = (iso: string) =>
    format(parseISO(iso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const handleConfirmClone = () => {
    if (!cloneConfirm || !selectedCompany) return;
    const payload = {
      id_empresa: selectedCompany,
      sourceDate: cloneConfirm.source.data,
      targetDate: cloneConfirm.target.data,
    };
    setCloneConfirm(null);
    setTransferPhase('running');
    cloneMutation.mutate(payload);
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
              {/* Período A — source */}
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
                  {renderTable(
                    leftAnalytics,
                    leftLoading,
                    leftFrom,
                    leftTo,
                    'source',
                    selectedSourceDay?.data ?? null,
                    (day) => setSelectedSourceDay((prev) => (prev?.data === day.data ? null : day))
                  )}
                </CardContent>
              </Card>

              {/* Período B — target */}
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
                  {renderTable(
                    rightAnalytics,
                    rightLoading,
                    rightFrom,
                    rightTo,
                    'target',
                    selectedTargetDay?.data ?? null,
                    (day) => setSelectedTargetDay((prev) => (prev?.data === day.data ? null : day))
                  )}
                </CardContent>
              </Card>

              {periodosDefinidos && (
                <div className="flex flex-col items-stretch gap-3 rounded-xl border border-border bg-muted/20 p-4 lg:col-span-2">
                  <p className="text-center text-sm text-muted-foreground">
                    {selectedSourceDay && selectedTargetDay
                      ? 'Confira origem e destino e clique em Clonar para abrir a confirmação.'
                      : 'Selecione um dia em cada período (clique na linha) para habilitar a clonagem.'}
                  </p>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                      <span className="text-muted-foreground">Origem (A):</span>
                      <span className="font-medium">
                        {selectedSourceDay
                          ? format(parseISO(selectedSourceDay.data), 'dd/MM/yyyy')
                          : '—'}
                      </span>
                      <ArrowRight className="hidden h-4 w-4 text-muted-foreground sm:inline" />
                      <span className="text-muted-foreground sm:hidden">→</span>
                      <span className="text-muted-foreground">Destino (B):</span>
                      <span className="font-medium">
                        {selectedTargetDay
                          ? format(parseISO(selectedTargetDay.data), 'dd/MM/yyyy')
                          : '—'}
                      </span>
                    </div>
                    <Button
                      className="sm:ml-2"
                      disabled={!selectedSourceDay || !selectedTargetDay}
                      onClick={() => {
                        if (selectedSourceDay && selectedTargetDay) {
                          setCloneConfirm({
                            source: selectedSourceDay,
                            target: selectedTargetDay,
                          });
                        }
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Clonar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de clone */}
      <Dialog open={!!cloneConfirm} onOpenChange={() => setCloneConfirm(null)}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4 text-primary" />
              Confirmar clonagem
            </DialogTitle>
            <DialogDescription>
              Deseja clonar os votos do dia abaixo para o dia de destino?
            </DialogDescription>
          </DialogHeader>

          {cloneConfirm && (
            <div className="space-y-4 py-2">
              <div className="flex items-start gap-3">
                {/* Origem */}
                <div className="flex-1 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Origem (Período A)
                  </p>
                  <p className="font-medium">{formatDate(cloneConfirm.source.data)}</p>
                  <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                    <p>😊 Ótimo: <span className="font-medium text-foreground">{cloneConfirm.source.Ótimo}</span></p>
                    <p>🙂 Bom: <span className="font-medium text-foreground">{cloneConfirm.source.Bom}</span></p>
                    <p>😐 Regular: <span className="font-medium text-foreground">{cloneConfirm.source.Regular}</span></p>
                    {!deveOcultarRuim && (
                      <p>😞 Ruim: <span className="font-medium text-foreground">{cloneConfirm.source.Ruim}</span></p>
                    )}
                    <p className="font-semibold text-foreground">Total: {cloneConfirm.source.total}</p>
                  </div>
                </div>

                <ArrowRight className="mt-8 h-5 w-5 shrink-0 text-muted-foreground" />

                {/* Destino */}
                <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Destino (Período B)
                  </p>
                  <p className="font-medium">{formatDate(cloneConfirm.target.data)}</p>
                  <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
                    <p>😊 Ótimo: <span className="font-medium text-foreground">{cloneConfirm.target.Ótimo}</span></p>
                    <p>🙂 Bom: <span className="font-medium text-foreground">{cloneConfirm.target.Bom}</span></p>
                    <p>😐 Regular: <span className="font-medium text-foreground">{cloneConfirm.target.Regular}</span></p>
                    {!deveOcultarRuim && (
                      <p>😞 Ruim: <span className="font-medium text-foreground">{cloneConfirm.target.Ruim}</span></p>
                    )}
                    <p className="font-semibold text-foreground">Total: {cloneConfirm.target.total}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCloneConfirm(null)} disabled={cloneMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmClone} disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? 'Enviando…' : 'Confirmar clonagem'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay animado: transferência */}
      {transferPhase !== 'idle' && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-background/75 backdrop-blur-md animate-in fade-in duration-300"
          role="presentation"
          aria-live="polite"
        >
          <div className="mx-4 w-full max-w-lg rounded-2xl border border-primary/20 bg-card/95 p-8 text-center shadow-2xl shadow-primary/10">
            {transferPhase === 'running' && (
              <>
                <div className="mb-2 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary animate-transfer-glow">
                    <Sparkles className="h-7 w-7" />
                  </div>
                </div>
                <h2 className="text-lg font-semibold tracking-tight">Transferindo votos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Copiando do período A para o período B…
                </p>

                <div className="relative mx-auto mt-8 h-36 w-full max-w-md overflow-visible">
                  <div className="absolute inset-x-0 top-1/2 h-14 -translate-y-1/2 rounded-full border border-primary/25 bg-gradient-to-r from-muted/40 via-primary/10 to-muted/40 shadow-inner" />
                  <div
                    className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 rounded-full opacity-80"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.35) 50%, transparent 100%)',
                      backgroundSize: '220% 100%',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-2 top-1/2 h-10 -translate-y-1/2 animate-conduit-shimmer rounded-full opacity-60"
                    style={{
                      background:
                        'linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.55) 45%, hsl(var(--primary) / 0.25) 55%, transparent 100%)',
                      backgroundSize: '240% 100%',
                    }}
                  />
                  <div className="absolute left-1/2 top-1/2 h-2 w-[min(90%,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-primary/80 to-transparent blur-[2px]" />
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary)),0_0_4px_hsl(var(--primary)/0.8)] animate-packet-dash"
                      style={{ animationDelay: `${i * 0.095}s` }}
                    />
                  ))}
                </div>
              </>
            )}

            {transferPhase === 'success' && (
              <div className="animate-transfer-success-pop py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-9 w-9" strokeWidth={2.25} />
                </div>
                <h2 className="text-lg font-semibold">Concluído</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lastClonedCount === 0
                    ? 'Não havia votos ativos para copiar nesse dia de origem.'
                    : lastClonedCount != null
                      ? `${lastClonedCount} voto(s) replicado(s) no dia de destino.`
                      : 'Operação finalizada.'}
                </p>
              </div>
            )}

            {transferPhase === 'error' && (
              <div className="py-6 animate-in zoom-in-95 duration-200">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                  <XCircle className="h-8 w-8" />
                </div>
                <h2 className="text-lg font-semibold">Não foi possível concluir</h2>
                <p className="mt-2 text-sm text-muted-foreground">Verifique sua conexão e permissões e tente de novo.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
