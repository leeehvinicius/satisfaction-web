import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { votes, companies } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isToday } from "date-fns";
import {
  RefreshCw,
  Building2,
  AlertTriangle,
  Activity,
  BarChart3,
  Heart,
  ThumbsUp,
  Star,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, subHours, subDays, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import VoteFloatingBars from "@/components/VoteFloatingBars";
import VoteStats from "@/components/VoteStats";
import { Vote, VoteAnalytics } from "@/types/vote";

// --- Relógio do dispositivo (atualiza a cada 1s) ---
function useDeviceClock(tickMs = 1000) {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
}
// ----------------------------------------------------

// -------------------- AJUSTE DE HORA: EMPRESA + SOMENTE NA TV --------------------
const COMPANY_FIX_ID = "df2096e7-4036-44f8-bde0-9e3c70a2e99b";
const TV_FIX_KEY = "vv_tv_time_fix"; // localStorage: "1" = aplicar, "0" = não aplicar

function isSmartTVUA() {
  const ua = (navigator.userAgent || "").toLowerCase();
  // heurística ampla (Tizen, webOS, HbbTV, Android TV, Fire TV, Bravia, etc.)
  return /(smart[-\s]?tv|tizen|webos|hbbtv|googletv|android\s?tv|aftmm?|aftt|afts|bravia|netcast|hisense|aquos|coocaa|appletv|firetv|crkey)/i.test(
    ua
  );
}

function getTvFixFlag() {
  try {
    return (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(TV_FIX_KEY) === "1"
    );
  } catch {
    return false;
  }
}

// permite ligar/desligar via querystring ?tvfix=1 ou ?tvfix=0, persistindo na TV
function setTvFixFlagFromQueryOnce() {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("tvfix"); // "1" liga, "0" desliga
    if (q === "1" || q === "0") localStorage.setItem(TV_FIX_KEY, q);
  } catch {}
}

function mustApplyOffset(companyId?: string | null) {
  const onTargetCompany = companyId === COMPANY_FIX_ID;
  const tvDetected = isSmartTVUA() || getTvFixFlag();
  return onTargetCompany && tvDetected;
}

// retorna "agora" possivelmente com -1h
function getNow(base: Date, companyId?: string | null) {
  return mustApplyOffset(companyId) ? subHours(base, 1) : base;
}
// --------------------------------------------------------------------------------

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

type TimeRange = "1h" | "24h" | "7d" | "30d";

const transformAnalytics = (data: VoteAnalytics): Analytics => {
  return {
    ...data,
    averageRating: calculateAverageRating(data.avaliacoesPorTipo),
    votesByService: Object.entries(data.votesByService).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: {
          ...value,
          average: calculateAverageRating((value as any).avaliacoes),
        },
      }),
      {} as Analytics["votesByService"]
    ),
  };
};

const Monitor: React.FC = () => {
  const { companyId: selectedCompanyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [alerts, setAlerts] = useState<
    Array<{
      type: "warning" | "error" | "success";
      message: string;
      timestamp: Date;
    }>
  >([]);
  const [activeServicesFilter, setActiveServicesFilter] =
    useState<boolean>(false);
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

  // inicializa/atualiza flag via querystring (só roda no browser da TV)
  useEffect(() => {
    setTvFixFlagFromQueryOnce();
  }, []);

  // --- Hora do aparelho (24h) usando hora possivelmente ajustada ---
  const now = useDeviceClock(1000);
  const adjustedNow = getNow(now, selectedCompanyId);
  const deviceTime = adjustedNow.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // -----------------------------------------------------------------

  // Query para buscar todas as empresas
  const { data: companiesList } = useQuery({
    queryKey: ["my-companies"],
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
  const {
    data: initialAnalytics,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["analytics", selectedCompanyId],
    queryFn: async () => {
      if (selectedCompanyId) {
        try {
          const data = await votes.getAnalytics(selectedCompanyId);
          if (!data) {
            throw new Error("Nenhum dado retornado da API");
          }
          return transformAnalytics(data as VoteAnalytics);
        } catch (error) {
          console.error("Error fetching analytics:", error);
          toast({
            title: "Erro ao carregar dados",
            description:
              error instanceof Error ? error.message : "Erro desconhecido",
            variant: "destructive",
          });
          throw error;
        }
      }

      // Se não houver empresa selecionada, buscar dados de todas as empresas
      const allCompanies = await companies.getAll();
      const allAnalytics = await Promise.all(
        allCompanies.map(async (company) => {
          try {
            return await votes.getAnalytics(company.id);
          } catch (error) {
            console.error(
              `Error fetching analytics for company ${company.id}:`,
              error
            );
            return null;
          }
        })
      );

      // Filter out failed requests and ensure type safety
      const validAnalytics = allAnalytics.filter(
        (data): data is VoteAnalytics => data !== null
      );

      // Combinar os dados de todas as empresas
      const combinedAnalytics: Analytics = {
        totalVotes: 0,
        averageRating: 0,
        avaliacoesPorTipo: {},
        percentuaisPorTipo: {},
        votesByService: {},
        recentVotes: [],
      };

      validAnalytics.forEach((companyAnalytics) => {
        // Somar total de votos
        combinedAnalytics.totalVotes += companyAnalytics.totalVotes;

        // Combinar avaliações por tipo
        Object.entries(companyAnalytics.avaliacoesPorTipo).forEach(
          ([tipo, count]) => {
            combinedAnalytics.avaliacoesPorTipo[tipo] =
              (combinedAnalytics.avaliacoesPorTipo[tipo] || 0) + count;
          }
        );

        // Combinar votos por serviço
        Object.entries(companyAnalytics.votesByService).forEach(
          ([service, data]) => {
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
            Object.entries(typedServiceData.avaliacoes).forEach(
              ([tipo, count]) => {
                if (!serviceData.avaliacoes[tipo]) {
                  serviceData.avaliacoes[tipo] = 0;
                }
                serviceData.avaliacoes[tipo] += count;
              }
            );

            serviceData.votes.push(...typedServiceData.votes);
          }
        );

        // Adicionar votos recentes
        combinedAnalytics.recentVotes.push(...companyAnalytics.recentVotes);
      });

      // Calcular médias e percentuais
      combinedAnalytics.averageRating = calculateAverageRating(
        combinedAnalytics.avaliacoesPorTipo
      );

      // Calcular percentuais por tipo
      Object.entries(combinedAnalytics.avaliacoesPorTipo).forEach(
        ([tipo, count]) => {
          combinedAnalytics.percentuaisPorTipo[tipo] =
            (count / combinedAnalytics.totalVotes) * 100;
        }
      );

      // Calcular médias e percentuais por serviço
      Object.keys(combinedAnalytics.votesByService).forEach((service) => {
        const serviceData = combinedAnalytics.votesByService[service];
        serviceData.average = calculateAverageRating(serviceData.avaliacoes);

        // Calcular percentuais por tipo para cada serviço
        Object.entries(serviceData.avaliacoes).forEach(([tipo, count]) => {
          serviceData.percentuais[tipo] = (count / serviceData.total) * 100;
        });
      });

      // Ordenar votos recentes por data
      combinedAnalytics.recentVotes.sort(
        (a, b) =>
          new Date(b.momento_voto).getTime() -
          new Date(a.momento_voto).getTime()
      );

      return combinedAnalytics;
    },
    enabled: true,
    refetchInterval: 30000, // Refetch every 30 segundos
    refetchOnWindowFocus: true,
    staleTime: 10000, // Considera stale após 10s
  });

  const calculateAverageRating = (avaliacoes: { [key: string]: number }) => {
    const ratingValues = {
      Ótimo: 5,
      Bom: 4,
      Regular: 3,
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

  // Configuração do WebSocket (tempo real de votos)
  useEffect(() => {
    if (!selectedCompanyId) return;

    const socket: Socket = io("https://pesquisa.api.vvrefeicoes.com.br", {
      path: "/socket.io",
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("[WS] conectado:", socket.id);
      socket.emit("joinCompanyRoom", selectedCompanyId);
    });

    socket.on("voteUpdate", (analyticsFromWs: VoteAnalytics) => {
      const normalized = transformAnalytics(analyticsFromWs);
      setAnalytics(normalized);
      checkAlerts(normalized);
      console.log("[WS] voteUpdate recebido");
    });

    socket.on("disconnect", () => {
      console.log("[WS] desconectado");
    });

    return () => {
      socket.emit("leaveCompanyRoom", selectedCompanyId);
      socket.off("voteUpdate");
      socket.disconnect();
    };
  }, [selectedCompanyId]);

  // Update analytics state when initialAnalytics changes
  useEffect(() => {
    if (initialAnalytics) {
      setAnalytics(initialAnalytics);
      checkAlerts(initialAnalytics);
    }
  }, [initialAnalytics]);

  const checkAlerts = (data: Analytics) => {
    const newAlerts = [];

    // Verificar média geral
    if (data.averageRating < 3) {
      newAlerts.push({
        type: "warning",
        message: `Média geral baixa: ${data.averageRating.toFixed(1)}`,
        timestamp: new Date(),
      });
    }

    // Verificar serviços individuais
    Object.entries(data.votesByService).forEach(([service, serviceData]) => {
      if (serviceData.average < 3) {
        newAlerts.push({
          type: "warning",
          message: `Serviço "${service}" com média baixa: ${serviceData.average.toFixed(
            1
          )}`,
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
          type: "error",
          message: `Tendência de queda detectada: ${previousVote.toFixed(
            1
          )} → ${lastVote.toFixed(1)}`,
          timestamp: new Date(),
        });
      }
    }

    setAlerts(newAlerts);
  };

  const handleCompanyChange = (companyId: string) => {
    if (companyId === "all") {
      navigate("/monitor");
    } else {
      navigate(`/monitor/${companyId}`);
    }
  };

  const getTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case "1h":
        return "Última hora";
      case "24h":
        return "Últimas 24 horas";
      case "7d":
        return "Últimos 7 dias";
      case "30d":
        return "Últimos 30 dias";
    }
  };

  const getActiveServices = () => {
    if (!selectedCompany || !selectedCompany.servicos) return [];

    const nowAdj = getNow(new Date(), selectedCompanyId);
    const currentTime = nowAdj.getHours() * 60 + nowAdj.getMinutes();

    return selectedCompany.servicos.filter((service) => {
      // Primeiro verifica se o serviço está ativo (status true)
      if (!service.status) return false;

      const [startHour, startMinute] = service.hora_inicio
        .split(":")
        .map(Number);
      const [endHour, endMinute] = service.hora_final.split(":").map(Number);

      const serviceStartTime = startHour * 60 + startMinute;
      const serviceEndTime = endHour * 60 + endMinute;

      return currentTime >= serviceStartTime && currentTime <= serviceEndTime;
    });
  };

  const getFilteredVotes = (votes: Vote[]) => {
    if (!votes || votes.length === 0) return [];

    if (!activeService) return [];

    const serviceVotes =
      analytics?.votesByService[activeService.id]?.votes || [];

    // "Hoje" com base na hora ajustada (empresa + TV)
    const today = getNow(new Date(), selectedCompanyId)
      .toISOString()
      .slice(0, 10); // Ex: "2025-05-09"

    return serviceVotes.filter(
      (vote) => vote.momento_voto.slice(0, 10) === today
    );
  };

  const getRatingValue = (avaliacao: string): number => {
    switch (avaliacao) {
      case "Ótimo":
        return 5;
      case "Bom":
        return 4;
      case "Regular":
        return 3;
      default:
        return 0;
    }
  };

  const getRatingColor = (avaliacao: string) => {
    switch (avaliacao) {
      case "Ótimo":
        return "text-green-500";
      case "Bom":
        return "text-blue-500";
      case "Regular":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getRatingColorByValue = (value: number) => {
    if (value >= 4.5) return "text-green-500";
    if (value >= 3.5) return "text-blue-500";
    if (value >= 2.5) return "text-yellow-500";
    return "text-red-500";
  };

  const getRatingIcon = (avaliacao: string) => {
    switch (avaliacao) {
      case "Ótimo":
        return <Heart className="h-4 w-4 fill-current" />;
      case "Bom":
        return <ThumbsUp className="h-4 w-4" />;
      case "Regular":
        return <Star className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Função para limpar votos
  const clearVotes = () => {
    setAnalytics((prevAnalytics) => {
      if (!prevAnalytics) return null;

      // Reset the analytics to show all votes when in interval
      return {
        ...prevAnalytics,
        recentVotes: prevAnalytics.recentVotes,
        totalVotes: prevAnalytics.totalVotes,
        avaliacoesPorTipo: prevAnalytics.avaliacoesPorTipo,
        votesByService: prevAnalytics.votesByService,
      };
    });
  };

  // Efeito para verificar o serviço ativo periodicamente (usando hora ajustada)
  useEffect(() => {
    const checkActiveService = () => {
      if (!selectedCompany || !selectedCompany.servicos) return;

      const nowAdj = getNow(new Date(), selectedCompanyId);
      const currentTime = nowAdj.getHours() * 60 + nowAdj.getMinutes();

      const activeService = selectedCompany.servicos.find((service) => {
        if (!service.status) return false;

        const [startHour, startMinute] = service.hora_inicio
          .split(":")
          .map(Number);
        const [endHour, endMinute] = service.hora_final.split(":").map(Number);

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
  }, [selectedCompany, selectedCompanyId]);

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
              {error instanceof Error
                ? error.message
                : "Ocorreu um erro ao carregar os dados. Por favor, tente novamente."}
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="gap-2"
            >
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
  const averageInRange =
    filteredVotes.reduce(
      (acc, vote) => acc + getRatingValue(vote.avaliacao),
      0
    ) / (votesInRange || 1);

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
                    ? `Monitoramento de ${
                        companiesList?.find((c) => c.id === selectedCompanyId)
                          ?.nome
                      } (${
                        companiesList?.find((c) => c.id === selectedCompanyId)
                          ?.qtdbutao ?? 0
                      } botões)`
                    : "Monitoramento Geral"}
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
                    <span className="text-5xl font-bold text-red-500">
                      {service.nome}
                    </span>
                    {/* Hora do aparelho (24h) */}
                    <span className="mt-1 text-sm text-muted-foreground">
                      {deviceTime}
                    </span>
                  </div>
                );
              }
              return (
                <div className="flex flex-col items-center">
                  <span className="text-5xl font-bold text-red-500">
                    Intervalo
                  </span>
                  {/* Hora do aparelho (24h) */}
                  <span className="mt-1 text-sm text-muted-foreground">
                    {deviceTime}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={selectedCompanyId || "all"}
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

        {/* Estatísticas de Votos */}
        <Card className="mt-8 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="font-medium">Estatísticas de Votos</span>
            </div>
          </CardHeader>
          <CardContent>
            <VoteStats
              votes={filteredVotes}
              qtdbutao={
                companiesList?.find((c) => c.id === selectedCompanyId)
                  ?.qtdbutao ?? 0
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Monitor;
