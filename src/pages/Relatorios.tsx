import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { votes, companies } from '@/services/api';
import { VoteAnalytics } from '@/types/vote';
import Navbar from '@/components/Navbar';
import { ExportPDF } from '@/components/export-pdf';
import { ExportDetailedReport } from '@/components/export-detailed-report';
import { Progress } from "@/components/ui/progress";
import { parseISO } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SafeChart } from '@/components/SafeChart';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart, Line, BarChart,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = {
  'Ótimo': '#22c55e',
  'Bom': '#3b82f6',
  'Regular': '#f59e0b',
  'Ruim': '#ef4444'
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes}`;
};

export default function Relatorios() {
  const { id } = useParams();
  const contentRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [quickFilter, setQuickFilter] = useState('1d');
  const [selectedCompany, setSelectedCompany] = useState<string>(id || '');
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: companiesList } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getMine,
  });

  const filteredCompanies = React.useMemo(() => {
    if (!companiesList) return [];
    return companiesList.filter(company =>
      company.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companiesList, searchQuery]);

  // const { data: analytics } = useQuery({
  //   queryKey: ['votes', 'analytics', selectedCompany, dateRange, quickFilter],
  //   queryFn: () => {
  //     let startDate = new Date();
  //     let endDate = new Date();

  //     if (dateRange?.from && dateRange?.to) {
  //       startDate = dateRange.from;
  //       endDate = dateRange.to;
  //     } else {
  //       // Aplicar filtro rápido
  //       switch (quickFilter) {
  //         case '1d':
  //           startDate = new Date();
  //           endDate = new Date();
  //           break;
  //         case '7d':
  //           startDate = addDays(new Date(), -7);
  //           endDate = new Date();
  //           break;
  //         case '30d':
  //           startDate = addDays(new Date(), -30);
  //           endDate = new Date();
  //           break;
  //       }
  //     }

  //     return votes.getAnalyticsRelatorio(selectedCompany, {
  //       startDate: format(startDate, 'yyyy-MM-dd'),
  //       endDate: format(endDate, 'yyyy-MM-dd'),
  //     });
  //   },
  //   enabled: !!selectedCompany,
  // });

  const { data: analytics } = useQuery({
    queryKey: ['votes', 'analytics', selectedCompany, dateRange, quickFilter],
    queryFn: async () => {
      let startDate = new Date();
      let endDate = new Date();

      if (dateRange?.from && dateRange?.to) {
        startDate = dateRange.from;
        endDate = dateRange.to;
      } else {
        switch (quickFilter) {
          case '1d':
            startDate = new Date();
            endDate = new Date();
            break;
          case '7d':
            startDate = addDays(new Date(), -7);
            endDate = new Date();
            break;
          case '30d':
            startDate = addDays(new Date(), -30);
            endDate = new Date();
            break;
        }
      }

      const res = await votes.getAnalyticsRelatorio(selectedCompany, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      console.log('[DEBUG API Response]', res); // aqui você vê tudo que veio
      return res;
    },
    enabled: !!selectedCompany,
  });



  const pesquisaDiariaData = (analytics?.votesByDay || [])
    .sort((a, b) => new Date(a.data + 'T00:00:00').getTime() - new Date(b.data + 'T00:00:00').getTime())
    .map((day) => ({
      dia: format(new Date(day.data + 'T00:00:00'), 'dd/MM'),
      satisfeito: (day.Ótimo || 0) + (day.Bom || 0),
      melhorar: (day.Regular || 0) + (day.Ruim || 0),
    }));


  const pontosMelhoriaData = analytics ? Object.entries(analytics.avaliacoesPorTipo).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS]
  })) : [];

  const resultadoDiaData = analytics ? Object.entries(analytics.percentuaisPorTipo).map(([name, value]) => ({
    name,
    value,
    color: COLORS[name as keyof typeof COLORS]
  })) : [];

  const resultadoDiaDataFiltrado = resultadoDiaData.filter(entry => entry.value > 0);

  const votosPorDia = analytics?.votesByDay || [];
  console.table(votosPorDia);

  const getPercentage = (value: number) => {
    if (!analytics?.totalVotes) return '0';
    return ((value / analytics.totalVotes) * 100).toFixed(1);
  };

  const totalVotes = analytics?.totalVotes || 0;




  const satisfacaoServicoData = analytics ? Object.entries(analytics.votesByService)
    .map(([id, data]) => ({
      name: data.serviceInfo?.nome || id,
      total: data.total,
      avaliacoes: data.avaliacoes,
      percentuais: data.percentuais
    })) : [];

  const satisfactionPercent = analytics
    ? ((analytics.avaliacoesPorTipo.Ótimo + analytics.avaliacoesPorTipo.Bom) / analytics.totalVotes * 100)
    : 0;


  const getFileName = () => {
    const startDate = dateRange?.from ? format(dateRange.from, 'dd-MM-yyyy') : '';
    const endDate = dateRange?.to ? format(dateRange.to, 'dd-MM-yyyy') : '';
    return `relatorio-${startDate}-${endDate}.pdf`;
  };

  const diasSelecionados = (() => {
    if (dateRange?.from && dateRange?.to) {
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      return Math.max(Math.floor(diffTime / (1000 * 60 * 60 * 24)), 0); // personalizado: sem +1
    }

    switch (quickFilter) {
      case '1d':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      default:
        return 1;
    }
  })();

  const getServiceEmoji = (name: string) => {
    switch (name.toLowerCase()) {
      case 'desjejum':
        return '🥐';
      case 'almoço':
        return '🍽️';
      case 'janta':
        return '🍲';
      case 'ceia':
        return '🌙';
      case 'merenda':
        return '🍎';
      default:
        return '📊';
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Bom':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Regular':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Ruim':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getRatingEmoji = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return '😊';
      case 'Bom':
        return '🙂';
      case 'Regular':
        return '😐';
      case 'Ruim':
        return '😞';
      default:
        return '❓';
    }
  };

  const getSatisfactionLevel = (percentual: number) => {
    if (percentual >= 80) return 'Excelente';
    if (percentual >= 60) return 'Bom';
    if (percentual >= 40) return 'Regular';
    return 'Precisa melhorar';
  };

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setQuickFilter('custom');
  };

  const handleQuickFilterChange = (value: string) => {
    setQuickFilter(value);
    if (value !== 'custom') {
      setDateRange(undefined);
    }
  };

  const getPeriodText = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'dd/MM/yyyy')} - ${format(dateRange.to, 'dd/MM/yyyy')}`;
    }

    switch (quickFilter) {
      case '1d':
        return 'Hoje';
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
      default:
        return 'Hoje';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Força uma nova renderização dos gráficos
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsExporting(false);
  };
  const empresaSelecionada = companiesList?.find(c => c.id === selectedCompany);
  const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

  const getDetailedReportData = () => {
    if (!analytics || !companiesList) return { dailyData: [], negativeResponses: [] };

    const dailyData = votosPorDia.map(day => ({
      data: format(parseISO(day.data), 'dd/MM/yyyy'),
      empresa: companiesList.find(c => c.id === selectedCompany)?.nome || 'Empresa',
      otimo: day.Ótimo || 0,
      bom: day.Bom || 0,
      regular: day.Regular || 0,
      ruim: day.Ruim || 0,
      total: day.total || 0
    }));

    const negativeResponses = analytics.votosNegativos?.map(voto => ({
      data: format(parseISO(voto.momento_voto), 'dd/MM/yyyy'),
      empresa: companiesList.find(c => c.id === selectedCompany)?.nome || 'Empresa',
      voto: `${voto.avaliacao === 'Regular' ? '😐' : '😞'} ${voto.avaliacao}`,
      servico: voto.tipo_servico?.nome || '-',
      comentario: voto.comentario || '-'
    })) || [];

    return { dailyData, negativeResponses };
  };

  return (

    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
              <p className="text-muted-foreground">
                {selectedCompany
                  ? `Relatórios de ${companiesList?.find(c => c.id === selectedCompany)?.nome}`
                  : 'Relatórios Gerais'}
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[250px] justify-between bg-white hover:bg-gray-50 border-gray-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏢</span>
                      <span className="font-medium">
                        {selectedCompany
                          ? companiesList?.find((company) => company.id === selectedCompany)?.nome
                          : "Selecione uma empresa"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                  <div className="rounded-lg border shadow-md">
                    <div className="flex items-center border-b px-3">
                      <span className="text-lg mr-2">🔍</span>
                      <input
                        className="h-9 w-full border-none focus:ring-0 outline-none"
                        placeholder="Buscar empresa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="max-h-[300px] overflow-auto">
                      {filteredCompanies.length === 0 ? (
                        <div className="py-6 text-center text-sm text-gray-500">
                          Nenhuma empresa encontrada.
                        </div>
                      ) : (
                        filteredCompanies.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              setSelectedCompany(company.id);
                              setOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <Check
                              className={cn(
                                "h-4 w-4 text-green-600",
                                selectedCompany === company.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="flex-1">{company.nome}</span>
                            {selectedCompany === company.id && (
                              <span className="text-xs text-gray-500">Selecionado</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Tabs value={quickFilter} onValueChange={handleQuickFilterChange}>
                <TabsList>
                  <TabsTrigger value="1d">Hoje</TabsTrigger>
                  <TabsTrigger value="7d">7 dias</TabsTrigger>
                  <TabsTrigger value="30d">30 dias</TabsTrigger>
                  <TabsTrigger value="custom">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateChange}
              />
              <div className="flex gap-2">
                <ExportPDF
                  contentRef={contentRef}
                  fileName={getFileName()}
                  title={`Relatório de Satisfação - ${companiesList?.find(c => c.id === selectedCompany)?.nome || 'Geral'}`}
                  subtitle={`Período: ${getPeriodText()}`}
                />
                {analytics && (
                  <ExportDetailedReport
                    {...getDetailedReportData()}
                    fileName={`relatorio-detalhado-${format(new Date(), 'dd-MM-yyyy')}.pdf`}
                    companyName={companiesList?.find(c => c.id === selectedCompany)?.nome || 'Empresa'}
                  />
                )}
              </div>
            </div>
          </div>

          {!selectedCompany ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Selecione uma empresa</h2>
                <p className="text-muted-foreground">Escolha uma empresa para visualizar os relatórios</p>
              </div>
            </div>
          ) : !analytics ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Carregando dados...</h2>
                <p className="text-muted-foreground">Aguarde enquanto buscamos as informações</p>
              </div>
            </div>
          ) : (
            <div
              id="content-to-export"
              ref={contentRef}
              className="space-y-6 bg-white p-6 rounded-lg shadow-sm"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {`Relatório de Satisfação - ${companiesList?.find(c => c.id === selectedCompany)?.nome || 'Geral'} (${companiesList?.find(c => c.id === selectedCompany)?.qtdbutao ?? 0} botões)`}
                </h2>
                <p className="text-muted-foreground">{`Período: ${getPeriodText()}`}</p>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {/* Resumo Geral */}
                <div ref={contentRef} className="bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            Total de Votos
                          </CardTitle>
                          <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            {analytics.totalVotes} votos
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Votos no período</span>
                            <span className="text-4xl font-bold">{analytics.totalVotes}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-gray-500">Média diária</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {(analytics.totalVotes / 7).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📈</span>
                            Taxa de Satisfação
                          </CardTitle>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${satisfactionPercent >= 80 ? 'bg-green-100 text-green-800' :
                            satisfactionPercent >= 60 ? 'bg-blue-100 text-blue-800' :
                              satisfactionPercent >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {getSatisfactionLevel(satisfactionPercent)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Satisfação geral</span>
                            <span className="text-4xl font-bold text-green-600">
                              {satisfactionPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-sm text-gray-500">Votos positivos</span>
                            <span className="text-2xl font-bold">
                              {analytics.avaliacoesPorTipo.Ótimo + analytics.avaliacoesPorTipo.Bom}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Pesquisa Diária */}
                  <Card className="border-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-2xl">📊</span>
                          Pesquisa Diária
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]"> {/* aumentei um pouco a altura */}
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pesquisaDiariaData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="dia"
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend wrapperStyle={{ marginTop: 30 }} />
                            <Bar dataKey="satisfeito" fill="#22c55e" name="Satisfeito" />
                            <Bar dataKey="melhorar" fill="#ef4444" name="Melhorar" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>



                  <Card className="border-2 w-full">
                    <CardHeader className="pb-2">
                      <h2 className="text-2xl font-bold text-center">
                        Resultado do Dia
                        {/* : {format(new Date(), 'dd MMM/yyyy')} */}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <tbody>
                            {pontosMelhoriaData
                              .filter((entry) => {
                                const empresaSelecionada = companiesList?.find(c => c.id === selectedCompany);
                                // Oculta "Ruim" se a empresa tiver 3 botões
                                if (empresaSelecionada?.qtdbutao === 3 && entry.name === 'Ruim') return false;
                                return true;
                              })
                              .map((entry) => (
                                <tr key={entry.name} className="border-t">
                                  <td className="py-2 flex items-center gap-2">
                                    <span className="text-xl">
                                      {{
                                        'Ótimo': '😊',
                                        'Bom': '😀',
                                        'Regular': '😐',
                                        'Ruim': '😞'
                                      }[entry.name] || '❓'}
                                    </span>
                                    {entry.name}
                                  </td>
                                  <td className="py-2 text-center w-16">{entry.value || 0}</td>
                                  <td className="py-2 w-full">
                                    <Progress value={parseFloat(getPercentage(entry.value))} className="h-2" />
                                  </td>
                                  <td className="py-2 text-center w-16">{getPercentage(entry.value)}%</td>
                                </tr>
                              ))}
                            <tr className="border-t font-bold">
                              <td className="py-2">Total</td>
                              <td className="py-2 text-center">{totalVotes}</td>
                              <td></td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>


                      <p className="text-xs text-gray-400 text-center mt-4">* Todos os horários</p>
                    </CardContent>
                  </Card>





                  {/* Gráficos Principais */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            Distribuição de Avaliações
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Total:</span>
                            <span className="font-bold">{analytics.totalVotes}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={pontosMelhoriaData.filter(entry => !deveOcultarRuim || entry.name !== 'Ruim')}>

                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '0.5rem',
                                  padding: '0.5rem'
                                }}
                                formatter={(value: number) => [`${value} votos`, '']}
                              />
                              <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
                                {pontosMelhoriaData
                                  .filter(entry => !deveOcultarRuim || entry.name !== 'Ruim')
                                  .map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                                  ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {pontosMelhoriaData
                            .filter(entry => !deveOcultarRuim || entry.name !== 'Ruim')
                            .map((entry) => (
                              <div
                                key={entry.name}
                                className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(entry.name)}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">{getRatingEmoji(entry.name)}</span>
                                  <span className="font-medium">{entry.name}</span>
                                </div>
                                <span className="font-bold">{entry.value}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-2">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <span className="text-2xl">📊</span>
                            Resultado do Dia
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Data:</span>
                            <span className="font-bold">{format(new Date(), 'dd/MM/yyyy')}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const empresaSelecionada = companiesList?.find(c => c.id === selectedCompany);
                          const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

                          const avaliacoesBase = ['Ótimo', 'Bom', 'Regular', 'Ruim'];
                          const completado = avaliacoesBase.map((label) => {
                            const original = resultadoDiaData.find((e) => e.name === label);
                            return {
                              name: label,
                              value: original?.value ?? 0,
                              color: COLORS[label as keyof typeof COLORS],
                            };
                          });

                          const graficoData = completado
                            .filter((entry) => (!deveOcultarRuim || entry.name !== 'Ruim') && entry.value > 0);

                          const cartoesData = completado
                            .filter((entry) => !deveOcultarRuim || entry.name !== 'Ruim');

                          return (
                            <>
                              {/* Gráfico Pizza */}
                              <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RechartsPieChart>
                                    <Pie
                                      data={graficoData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                      {graficoData.map((entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={COLORS[entry.name as keyof typeof COLORS]}
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        padding: '0.5rem',
                                      }}
                                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                                    />
                                    <Legend
                                      verticalAlign="bottom"
                                      height={36}
                                      formatter={(value) => <span className="text-sm">{value}</span>}
                                    />
                                  </RechartsPieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Cartões com % por avaliação */}
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                {cartoesData.map((entry) => (
                                  <div
                                    key={entry.name}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(entry.name)}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{getRatingEmoji(entry.name)}</span>
                                      <span className="font-medium">{entry.name}</span>
                                    </div>
                                    <span className="font-bold">{entry.value.toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                            </>
                          );
                        })()}
                      </CardContent>
                    </Card>


                  </div>
                  <>
                    <style>{`
                  .pdf-break {
                    height: 0;
                  }
                `}</style>

                    <div className="pdf-break" />
                  </>

                  {/* Análise por Serviço */}
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(() => {
                        const empresaSelecionada = companiesList?.find(c => c.id === selectedCompany);
                        const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

                        return Object.entries(analytics.votesByService)
                          .filter(([_, data]) => data.serviceInfo)
                          .map(([_, data]) => {
                            const satisfactionPercent = data.percentuais.Ótimo + data.percentuais.Bom;

                            const avaliacoesBase = ['Ótimo', 'Bom', 'Regular', 'Ruim'];
                            const avaliacaoCompletada = avaliacoesBase
                              .filter((label) => !deveOcultarRuim || label !== 'Ruim')
                              .map((label) => ({
                                label,
                                count: data.avaliacoes[label as keyof typeof data.avaliacoes] ?? 0,
                                percent: data.percentuais[label as keyof typeof data.percentuais] ?? 0,
                              }));

                            return (
                              <div key={data.serviceInfo?.nome} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      <span className="text-2xl">{getServiceEmoji(data.serviceInfo?.nome || '')}</span>
                                      {data.serviceInfo?.nome}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {formatTime(data.serviceInfo?.hora_inicio)} - {formatTime(data.serviceInfo?.hora_final)}
                                    </p>
                                  </div>
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${satisfactionPercent >= 80
                                    ? 'bg-green-100 text-green-800'
                                    : satisfactionPercent >= 60
                                      ? 'bg-blue-100 text-blue-800'
                                      : satisfactionPercent >= 40
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {satisfactionPercent.toFixed(1)}%
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {avaliacaoCompletada.map(({ label, count, percent }) => (
                                    <div
                                      key={label}
                                      className={`flex items-center justify-between p-2 rounded-lg ${getRatingColor(label)}`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl">{getRatingEmoji(label)}</span>
                                        <span className="font-medium">{label}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold">{count}</span>
                                        <span className="text-sm text-muted-foreground">
                                          ({percent.toFixed(1)}%)
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Blocos adicionais */}
                                <div className="grid grid-cols-4 gap-2 mt-4">
                                  <div className="bg-green-100 text-green-800 text-center p-3 rounded-lg shadow">
                                    <p className="text-sm font-semibold">Qtd. de Votos</p>
                                    <p className="text-xl font-bold">{data.total}</p>
                                  </div>
                                  <div className="bg-yellow-100 text-yellow-800 text-center p-3 rounded-lg shadow">
                                    <p className="text-sm font-semibold">Qtd. Refeições</p>
                                    <p className="text-xl font-bold">{(data.serviceInfo?.qtd_ref || 0) * diasSelecionados}</p>
                                  </div>
                                  <div className="bg-red-100 text-red-800 text-center p-3 rounded-lg shadow">
                                    <p className="text-sm font-semibold">Diferença</p>
                                    <p className="text-xl font-bold">
                                      {((data.serviceInfo?.qtd_ref || 0) * diasSelecionados) - data.total}
                                    </p>
                                  </div>
                                  <div className="bg-orange-100 text-orange-800 text-center p-3 rounded-lg shadow">
                                    <p className="text-sm font-semibold">Diferença %</p>
                                    <p className="text-xl font-bold">
                                      {(() => {
                                        const qtdRefeicoes = (data.serviceInfo?.qtd_ref || 0) * diasSelecionados;
                                        const diferenca = qtdRefeicoes - data.total;

                                        // Se não há refeições esperadas, calcula em relação aos votos
                                        if (qtdRefeicoes === 0 && data.total > 0) {
                                          return '100.0%';
                                        }

                                        // Se não há votos nem refeições
                                        if (qtdRefeicoes === 0 && data.total === 0) {
                                          return '0.0%';
                                        }

                                        // Cálculo normal: diferença / refeições esperadas
                                        const percentual = (Math.abs(diferenca) / qtdRefeicoes) * 100;
                                        return `${percentual.toFixed(1)}%`;
                                      })()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </CardContent>
                </div>
                {/* Marcador onde para */}
                <div id="pdf-end-marker"></div>



                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      Relatório Detalhado por Dia
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const empresaSelecionada = companiesList?.find(c => c.id === selectedCompany);
                      const deveOcultarRuim = empresaSelecionada?.qtdbutao === 3;

                      return (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-gray-700">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left">Data</th>
                                <th className="px-4 py-2 text-left">Empresa</th>
                                <th className="px-4 py-2 text-center">😊 Ótimo</th>
                                <th className="px-4 py-2 text-center">🙂 Bom</th>
                                <th className="px-4 py-2 text-center">😐 Regular</th>
                                {!deveOcultarRuim && (
                                  <th className="px-4 py-2 text-center">😞 Ruim</th>
                                )}
                                <th className="px-4 py-2 text-center font-bold">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {votosPorDia.map((day, index) => {
                                // Verifica se deve inserir quebra de página
                                const isFirstBreak = index === 47;
                                const isSubsequentBreak = index > 47 && (index - 47) % 52 === 0;

                                return (
                                  <React.Fragment key={index}>
                                    {(isFirstBreak || isSubsequentBreak) && (
                                      <tr className="page-break">
                                        <td colSpan={10}></td>
                                      </tr>
                                    )}

                                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        {format(parseISO(day.data), 'dd/MM/yyyy')}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap">
                                        {empresaSelecionada?.nome || 'Empresa'}
                                      </td>
                                      <td className="px-4 py-2 text-center">{day.Ótimo || 0}</td>
                                      <td className="px-4 py-2 text-center">{day.Bom || 0}</td>
                                      <td className="px-4 py-2 text-center">{day.Regular || 0}</td>
                                      {!deveOcultarRuim && (
                                        <td className="px-4 py-2 text-center">{day.Ruim || 0}</td>
                                      )}
                                      <td className="px-4 py-2 text-center font-bold">{day.total || 0}</td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}

                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
                <div style={{ height: 0, pageBreakBefore: 'always', breakBefore: 'always' }} className="page-break" />



                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📅</span>
                      Relatório de Respostas Negativas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Data</th>
                            <th className="px-4 py-2 text-left">Empresa</th>
                            <th className="px-4 py-2 text-center">Voto</th>
                            <th className="px-4 py-2 text-center">Serviço</th>
                            <th className="px-4 py-2 text-center">Comentário</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics?.votosNegativos?.map((voto, index) => {
                            const isFirstBreak = index === 47;
                            const isSubsequentBreak = index > 47 && (index - 47) % 52 === 0;

                            return (
                              <React.Fragment key={index}>
                                {(isFirstBreak || isSubsequentBreak) && (
                                  <tr className="page-break">
                                    <td colSpan={10}></td>
                                  </tr>
                                )}

                                <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    {format(parseISO(voto.momento_voto), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="px-4 py-2">{empresaSelecionada?.nome || 'Empresa'}</td>
                                  <td className="px-4 py-2 text-center">
                                    {voto.avaliacao === 'Regular' ? '😐' : '😞'} {voto.avaliacao}
                                  </td>
                                  <td className="px-4 py-2 text-center">{voto.tipo_servico?.nome || '-'}</td>
                                  <td className="px-4 py-2 text-center">{voto.comentario || '-'}</td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>

  );
}