import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { votes, companies } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { isToday } from 'date-fns';
import {
  RefreshCw,
  TrendingUp,
  Users,
  Star,
  Building2,
  AlertTriangle,
  Clock,
  Activity,
  LineChart,
  BarChart3,
  Heart,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Bell,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, subHours, subDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import VoteFloatingBars from '@/components/VoteFloatingBars';
import VoteStats from '@/components/VoteStats';
import { Vote, VoteAnalytics } from '@/types/vote';

interface Analytics {
  totalVotes: number;
  averageRating: number;
  avaliacoesPorTipo: {
    [key: string]: number;
  };
  percentuaisPorTipo: {
    [key: string]: number;
  };
  votesByService: {
    [key: string]: {
      total: number;
      average: number;
      avaliacoes: {
        [key: string]: number;
      };
      percentuais: {
        [key: string]: number;
      };
      votes: Vote[];
    };
  };
  recentVotes: Vote[];
}

interface Company {
  id: string;
  name: string;
  servicos: {
    id: string;
    id_empresa: string;
    tipo_servico: string;
    nome: string;
    hora_inicio: string;
    hora_final: string;
    status: boolean;
    user_add: string;
    date_add: string;
  }[];
}

type TimeRange = '1h' | '24h' | '7d' | '30d';

const Monitor: React.FC = () => {
  const { companyId: selectedCompanyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [alerts, setAlerts] = useState<Array<{
    type: 'warning' | 'error' | 'success';
    message: string;
    timestamp: Date;
  }>>([]);
  const [activeServicesFilter, setActiveServicesFilter] = useState<boolean>(false);
  const [activeService, setActiveService] = useState<{
    id: string;
    id_empresa: string;
    tipo_servico: string;
    nome: string;
    hora_inicio: string;
    hora_final: string;
    status: boolean;
    user_add: string;
    date_add: string;
  } | null>(null);

  // Query para buscar todas as empresas
  const { data: companiesList } = useQuery({
    queryKey: ['my-companies'],
    queryFn: companies.getMine,
    // queryFn: companies.getAll,
  });

  useEffect(() => {
    if (companiesList && companiesList.length === 1) {
      navigate(`/monitor/${companiesList[0].id}`);
    }
  }, [companiesList, navigate]);

  const selectedCompany = companiesList?.find(
    (company) => company.id === selectedCompanyId
  );

  // Query para buscar dados iniciais
  const { data: initialAnalytics, refetch, isError, error } = useQuery({
    queryKey: ['analytics', selectedCompanyId],
    queryFn: async () => {
      if (selectedCompanyId) {
        try {
          const data = await votes.getAnalytics(selectedCompanyId);
          if (!data) {
            throw new Error('Nenhum dado retornado da API');
          }
          return {
            ...data,
            averageRating: calculateAverageRating(data.avaliacoesPorTipo),
            votesByService: Object.entries(data.votesByService).reduce((acc, [key, value]) => ({
              ...acc,
              [key]: {
                ...value,
                average: calculateAverageRating(value.avaliacoes),
              },
            }), {}),
          };
        } catch (error) {
          console.error('Error fetching analytics:', error);
          toast({
            title: 'Erro ao carregar dados',
            description: error instanceof Error ? error.message : 'Erro desconhecido',
            variant: 'destructive',
          });
          throw error;
        }
      }

      // Se não houver empresa selecionada, buscar dados de todas as empresas
      const allCompanies = await companies.getAll();
      const allAnalytics = await Promise.all(
        allCompanies.map(async company => {
          try {
            return await votes.getAnalytics(company.id);
          } catch (error) {
            console.error(`Error fetching analytics for company ${company.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed requests and ensure type safety
      const validAnalytics = allAnalytics.filter((data): data is VoteAnalytics => data !== null);

      // Combinar os dados de todas as empresas
      const combinedAnalytics: Analytics = {
        totalVotes: 0,
        averageRating: 0,
        avaliacoesPorTipo: {},
        percentuaisPorTipo: {},
        votesByService: {},
        recentVotes: [],
      };

      validAnalytics.forEach(companyAnalytics => {
        // Somar total de votos
        combinedAnalytics.totalVotes += companyAnalytics.totalVotes;

        // Combinar avaliações por tipo
        Object.entries(companyAnalytics.avaliacoesPorTipo).forEach(([tipo, count]) => {
          combinedAnalytics.avaliacoesPorTipo[tipo] = (combinedAnalytics.avaliacoesPorTipo[tipo] || 0) + count;
        });

        // Combinar votos por serviço
        Object.entries(companyAnalytics.votesByService).forEach(([service, data]) => {
          if (!combinedAnalytics.votesByService[service]) {
            combinedAnalytics.votesByService[service] = {
              total: 0,
              average: 0,
              avaliacoes: {},
              percentuais: {},
              votes: [],
            };
          }

          const serviceData = combinedAnalytics.votesByService[service];
          const typedServiceData = data as {
            total: number;
            avaliacoes: { [key: string]: number };
            votes: Vote[];
          };

          serviceData.total += typedServiceData.total;

          // Combinar avaliações por tipo para cada serviço
          Object.entries(typedServiceData.avaliacoes).forEach(([tipo, count]) => {
            if (!serviceData.avaliacoes[tipo]) {
              serviceData.avaliacoes[tipo] = 0;
            }
            serviceData.avaliacoes[tipo] += count;
          });

          serviceData.votes.push(...typedServiceData.votes);
        });

        // Adicionar votos recentes
        combinedAnalytics.recentVotes.push(...companyAnalytics.recentVotes);
      });

      // Calcular médias e percentuais
      combinedAnalytics.averageRating = calculateAverageRating(combinedAnalytics.avaliacoesPorTipo);

      // Calcular percentuais por tipo
      Object.entries(combinedAnalytics.avaliacoesPorTipo).forEach(([tipo, count]) => {
        combinedAnalytics.percentuaisPorTipo[tipo] = (count / combinedAnalytics.totalVotes) * 100;
      });

      // Calcular médias e percentuais por serviço
      Object.keys(combinedAnalytics.votesByService).forEach(service => {
        const serviceData = combinedAnalytics.votesByService[service];
        serviceData.average = calculateAverageRating(serviceData.avaliacoes);

        // Calcular percentuais por tipo para cada serviço
        Object.entries(serviceData.avaliacoes).forEach(([tipo, count]) => {
          serviceData.percentuais[tipo] = (count / serviceData.total) * 100;
        });
      });

      // Ordenar votos recentes por data
      combinedAnalytics.recentVotes.sort((a, b) =>
        new Date(b.momento_voto).getTime() - new Date(a.momento_voto).getTime()
      );

      return combinedAnalytics;
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchOnWindowFocus: true,
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  const calculateAverageRating = (avaliacoes: { [key: string]: number }) => {
    const ratingValues = {
      'Ótimo': 5,
      'Bom': 4,
      'Regular': 3,
      // 'Ruim': 2,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(avaliacoes).forEach(([tipo, count]) => {
      const value = ratingValues[tipo as keyof typeof ratingValues] || 0;
      weightedSum += value * count;
      totalWeight += count;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };

  // Configuração do WebSocket
  useEffect(() => {
    if (!selectedCompanyId) return;

    const newSocket = io(import.meta.env.VITE_API_URL as string);
    // const newSocket = io('https://api.vvrefeicoes.com.br');
    setSocket(newSocket);

    newSocket.emit('joinCompanyRoom', selectedCompanyId);

    newSocket.on('voteUpdate', async (updatedVote: Vote) => {
      // Update analytics state immediately
      setAnalytics(prevAnalytics => {
        if (!prevAnalytics) return null;

        // Atualiza os votos recentes
        const updatedRecentVotes = [updatedVote, ...prevAnalytics.recentVotes];

        // Atualiza as avaliações por tipo
        const updatedAvaliacoesPorTipo = {
          ...prevAnalytics.avaliacoesPorTipo,
          [updatedVote.avaliacao]: (prevAnalytics.avaliacoesPorTipo[updatedVote.avaliacao] || 0) + 1
        };

        // Atualiza os votos por serviço
        const updatedVotesByService = { ...prevAnalytics.votesByService };
        if (updatedVote.id_tipo_servico) {
          const serviceKey = updatedVote.id_tipo_servico;
          if (!updatedVotesByService[serviceKey]) {
            updatedVotesByService[serviceKey] = {
              total: 0,
              average: 0,
              avaliacoes: {},
              percentuais: {},
              votes: []
            };
          }

          const serviceData = updatedVotesByService[serviceKey];
          serviceData.total += 1;
          serviceData.votes = [updatedVote, ...serviceData.votes];
          serviceData.avaliacoes = {
            ...serviceData.avaliacoes,
            [updatedVote.avaliacao]: (serviceData.avaliacoes[updatedVote.avaliacao] || 0) + 1
          };
        }

        console.log('Updating analytics with new vote:', updatedVote);

        return {
          ...prevAnalytics,
          recentVotes: updatedRecentVotes,
          totalVotes: prevAnalytics.totalVotes + 1,
          avaliacoesPorTipo: updatedAvaliacoesPorTipo,
          votesByService: updatedVotesByService
        };
      });

      // Refetch to get fresh data
      await refetch();

      // Show toast notification
      toast({
        title: 'Novo voto recebido!',
        description: 'Os dados foram atualizados.',
        variant: 'default',
      });
    });

    return () => {
      newSocket.emit('leaveCompanyRoom', selectedCompanyId);
      newSocket.disconnect();
    };
  }, [selectedCompanyId, toast, refetch]);

  // Update analytics state when initialAnalytics changes
  useEffect(() => {
    if (initialAnalytics) {
      setAnalytics(initialAnalytics);
      checkAlerts(initialAnalytics);
    }
  }, [initialAnalytics]);

  // Refetch data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Refetch every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const checkAlerts = (data: Analytics) => {
    const newAlerts = [];

    // Verificar média geral
    if (data.averageRating < 3) {
      newAlerts.push({
        type: 'warning',
        message: `Média geral baixa: ${data.averageRating.toFixed(1)}`,
        timestamp: new Date(),
      });
    }

    // Verificar serviços individuais
    Object.entries(data.votesByService).forEach(([service, serviceData]) => {
      if (serviceData.average < 3) {
        newAlerts.push({
          type: 'warning',
          message: `Serviço "${service}" com média baixa: ${serviceData.average.toFixed(1)}`,
          timestamp: new Date(),
        });
      }
    });

    // Verificar tendência de queda
    if (data.recentVotes.length >= 2) {
      const lastVote = getRatingValue(data.recentVotes[0].avaliacao);
      const previousVote = getRatingValue(data.recentVotes[1].avaliacao);
      if (lastVote < previousVote && lastVote < 3) {
        newAlerts.push({
          type: 'error',
          message: `Tendência de queda detectada: ${previousVote.toFixed(1)} → ${lastVote.toFixed(1)}`,
          timestamp: new Date(),
        });
      }
    }

    setAlerts(newAlerts);
  };

  const handleCompanyChange = (companyId: string) => {
    if (companyId === 'all') {
      navigate('/monitor');
    } else {
      navigate(`/monitor/${companyId}`);
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case '1h':
        return 'Última hora';
      case '24h':
        return 'Últimas 24 horas';
      case '7d':
        return 'Últimos 7 dias';
      case '30d':
        return 'Últimos 30 dias';
    }
  };

  const getActiveServices = () => {
    if (!selectedCompany || !selectedCompany.servicos) return [];

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    return selectedCompany.servicos.filter(service => {
      // Primeiro verifica se o serviço está ativo (status true)
      if (!service.status) return false;

      const [startHour, startMinute] = service.hora_inicio.split(':').map(Number);
      const [endHour, endMinute] = service.hora_final.split(':').map(Number);

      const serviceStartTime = startHour * 60 + startMinute;
      const serviceEndTime = endHour * 60 + endMinute;

      return currentTime >= serviceStartTime && currentTime <= serviceEndTime;
    });
  };

  // const getFilteredVotes = (votes: Vote[]) => {
  //   if (!votes || votes.length === 0) return [];

  //   // Encontra a data mais recente dos votos
  //   const latestVoteDate = new Date(Math.max(...votes.map(v => new Date(v.momento_voto).getTime())));
  //   let startDate: Date;

  //   switch (timeRange) {
  //     case '1h':
  //       startDate = subHours(latestVoteDate, 1);
  //       break;
  //     case '24h':
  //       startDate = subHours(latestVoteDate, 24);
  //       break;
  //     case '7d':
  //       startDate = subDays(latestVoteDate, 7);
  //       break;
  //     case '30d':
  //       startDate = subDays(latestVoteDate, 30);
  //       break;
  //   }

  //   // Se houver um serviço ativo, usa os votos desse serviço
  //   if (activeService && analytics?.votesByService[activeService.id]) {
  //     let serviceVotes = analytics.votesByService[activeService.id].votes;

  //     // Filtra por intervalo de tempo
  //     return serviceVotes.filter((vote) =>
  //       isWithinInterval(new Date(vote.momento_voto), { start: startDate, end: latestVoteDate })
  //     );
  //   }

  //   // Se não houver serviço ativo, filtra todos os votos por tempo
  //   return votes.filter((vote) =>
  //     isWithinInterval(new Date(vote.momento_voto), { start: startDate, end: latestVoteDate })
  //   );
  // };


  const getFilteredVotes = (votes: Vote[]) => {
    if (!votes || votes.length === 0) return [];

    if (!activeService) return [];

    const serviceVotes = analytics?.votesByService[activeService.id]?.votes || [];

    const today = new Date().toISOString().slice(0, 10); // Ex: "2025-05-09"

    return serviceVotes.filter((vote) =>
      vote.momento_voto.slice(0, 10) === today
    );
  };
  const getRatingValue = (avaliacao: string): number => {
    switch (avaliacao) {
      case 'Ótimo':
        return 5;
      case 'Bom':
        return 4;
      case 'Regular':
        return 3;
      // case 'Ruim':
      //   return 2;
      default:
        return 0;
    }
  };

  const getRatingColor = (avaliacao: string) => {
    switch (avaliacao) {
      case 'Ótimo':
        return 'text-green-500';
      case 'Bom':
        return 'text-blue-500';
      case 'Regular':
        return 'text-yellow-500';
      // case 'Ruim':
      //   return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRatingColorByValue = (value: number) => {
    if (value >= 4.5) return 'text-green-500';
    if (value >= 3.5) return 'text-blue-500';
    if (value >= 2.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRatingIcon = (avaliacao: string) => {
    switch (avaliacao) {
      case 'Ótimo':
        return <Heart className="h-4 w-4 fill-current" />;
      case 'Bom':
        return <ThumbsUp className="h-4 w-4" />;
      case 'Regular':
        return <Star className="h-4 w-4" />;
      // case 'Ruim':
      //   return <ThumbsDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Função para limpar votos
  const clearVotes = () => {
    setAnalytics(prevAnalytics => {
      if (!prevAnalytics) return null;

      // Reset the analytics to show all votes when in interval
      return {
        ...prevAnalytics,
        recentVotes: prevAnalytics.recentVotes,
        totalVotes: prevAnalytics.totalVotes,
        avaliacoesPorTipo: prevAnalytics.avaliacoesPorTipo,
        votesByService: prevAnalytics.votesByService
      };
    });
  };

  // Efeito para verificar o serviço ativo periodicamente
  useEffect(() => {
    const checkActiveService = () => {
      if (!selectedCompany || !selectedCompany.servicos) return;

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const activeService = selectedCompany.servicos.find(service => {
        if (!service.status) return false;

        const [startHour, startMinute] = service.hora_inicio.split(':').map(Number);
        const [endHour, endMinute] = service.hora_final.split(':').map(Number);

        const serviceStartTime = startHour * 60 + startMinute;
        const serviceEndTime = endHour * 60 + endMinute;

        return currentTime >= serviceStartTime && currentTime <= serviceEndTime;
      });

      // Update active service state
      setActiveService(activeService || null);

      // If there's no active service (interval), show all votes
      if (!activeService) {
        clearVotes();
      }
    };

    // Verificar imediatamente
    checkActiveService();

    // Configurar intervalo para verificar a cada minuto
    const interval = setInterval(checkActiveService, 60000);

    return () => clearInterval(interval);
  }, [selectedCompany]);

  const getActiveService = () => {
    return activeService;
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="w-full px-6 py-24">
          <div className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">Erro ao carregar dados</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : 'Ocorreu um erro ao carregar os dados. Por favor, tente novamente.'}
            </p>
            <Button onClick={() => refetch()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedCompanyId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="w-full px-6 py-24">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-2xl font-semibold">Selecione uma empresa</h2>
            <p className="text-muted-foreground">
              Escolha uma empresa para monitorar em tempo real
            </p>
            <Select onValueChange={handleCompanyChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                {companiesList?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="w-full px-6 py-24">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  const filteredVotes = getFilteredVotes(analytics.recentVotes);
  const votesInRange = filteredVotes.length;
  const averageInRange = filteredVotes.reduce((acc, vote) => acc + getRatingValue(vote.avaliacao), 0) / (votesInRange || 1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="w-full px-6 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Monitor</h1>
                <p className="text-muted-foreground">
                  {selectedCompanyId
                    ? `Monitoramento de ${companiesList?.find(c => c.id === selectedCompanyId)?.nome} (${companiesList?.find(c => c.id === selectedCompanyId)?.qtdbutao ?? 0} botões)`
                    : 'Monitoramento Geral'}
                </p>
              </div>
            </div>
          </div>

          {/* SERVIÇO ATUAL - AQUI */}
          <div className="flex flex-col items-center justify-center flex-1 mx-6 my-4 md:my-0 text-center">
            {(() => {
              const service = getActiveService();
              if (service) {
                return (
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold text-red-500">{service.nome}</span>
                    {/* <span className="text-xs text-muted-foreground">
                        ({service.hora_inicio} - {service.hora_final})
                      </span> */}
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-red-500">
                    Intervalo
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedCompanyId || 'all'}
              onValueChange={handleCompanyChange}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione uma empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Empresas</SelectItem>
                {companiesList?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        {/* <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center space-x-4"> */}
        {/* <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Última hora</SelectItem>
                <SelectItem value="24h">Últimas 24 horas</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select> */}
        {/* <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activeServices"
                checked={activeServicesFilter}
                onChange={(e) => setActiveServicesFilter(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="activeServices" className="text-sm text-muted-foreground">
                Apenas serviços ativos
              </label>
            </div> */}
        {/* </div>
        </div> */}

        {/* Alertas */}
        {/* {alerts.length > 0 && (
          <div className="mb-8 space-y-4">
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                variant={alert.type === 'error' ? 'destructive' : 'default'}
                className={cn(
                  "border-l-4",
                  alert.type === 'error' ? "border-red-500" :
                    alert.type === 'warning' ? "border-yellow-500" :
                      "border-green-500"
                )}
              >
                {alert.type === 'error' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <AlertTitle>
                  {alert.type === 'error' ? 'Alerta Crítico' : alert.type === 'warning' ? 'Atenção' : 'Informação'}
                </AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )} */}

        {/* Serviço Atual
        {selectedCompany && (
          <Card className="mb-8 bg-gradient-to-br from-purple-500/5 to-purple-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Serviço Atual</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {(() => {
                const service = getActiveService();
                if (service) {
                  return (
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-sm font-medium">{service.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        ({service.hora_inicio} - {service.hora_final})
                      </span>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-gray-500" />
                    <span className="text-sm font-medium text-muted-foreground">
                      Intervalo
                    </span>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )} */}



        {/* Estatísticas de Votos */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle>Estatísticas de Votos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <VoteStats
              votes={filteredVotes}

              qtdbutao={companiesList?.find(c => c.id === selectedCompanyId)?.qtdbutao ?? 0}
            />
          </CardContent>
        </Card>


        {/* Status em tempo real */}
        {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 mt-8">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Ativo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Recebendo votos em tempo real
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Votos no período</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{votesInRange}</div>
              <p className="text-xs text-muted-foreground">
                {getTimeRangeLabel(timeRange)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média no período</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {averageInRange.toFixed(1)}
              </div>
              <Progress
                value={(averageInRange / 5) * 100}
                className="mt-2 bg-yellow-100 dark:bg-yellow-900/20"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tendência</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {averageInRange >= analytics.averageRating ? (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Crescendo
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    Diminuindo
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {Math.abs(averageInRange - analytics.averageRating).toFixed(1)} pontos
                </span>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Votos recentes com indicadores */}
        {/* <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Votos Recentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <VoteFloatingBars votes={filteredVotes} height={300} />
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
};

export default Monitor;