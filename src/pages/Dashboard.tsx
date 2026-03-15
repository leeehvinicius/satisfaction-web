import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { serviceTypes, votes, companies } from '@/services/api';
import VoteChart from '@/components/VoteChart';
import { RecentVotes } from '@/components/RecentVotes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowUpRight,
  Building,
  Zap,
  Activity,
  Monitor as MonitorIcon,
  LayoutList,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Vote } from '@/types/vote';
import { Company } from '@/types/company';
import { ServiceType } from '@/types/serviceType';
import { VoteCharts } from '@/components/VoteCharts';
import { NewsTicker } from '@/components/NewsTicker';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface CompanyVotes {
  name: string;
  votes: number;
  id: string;
}

interface ServiceTypeVotes {
  name: string;
  votes: number;
  id: string;
}

const statCardsConfig = [
  {
    key: 'votes' as const,
    label: 'Votos Totais',
    icon: Zap,
    iconBg: 'bg-primary/10 text-primary',
    accent: 'text-primary',
    badge: 'Tempo real',
    badgeIcon: ArrowUpRight,
  },
  {
    key: 'activity' as const,
    label: 'Atividade Recente',
    icon: Activity,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    accent: '',
    badge: null,
    badgeIcon: null,
  },
  {
    key: 'companies' as const,
    label: 'Empresas',
    icon: Building,
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    accent: '',
    badge: null,
    badgeIcon: null,
  },
  {
    key: 'services' as const,
    label: 'Tipos de Serviço',
    icon: LayoutList,
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    accent: '',
    badge: null,
    badgeIcon: null,
  },
];

const Dashboard: React.FC = () => {
  const [companyVotes, setCompanyVotes] = useState<CompanyVotes[]>([]);
  const [serviceTypeVotes, setServiceTypeVotes] = useState<ServiceTypeVotes[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);
  const [totalServiceTypes, setTotalServiceTypes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [allVotes, setAllVotes] = useState<Vote[]>([]);
  const [votesData, setVotesData] = useState<{ today: number; week: number; month: number }>({
    today: 0,
    week: 0,
    month: 0,
  });
  const [companiesList, setCompaniesList] = useState<Company[]>([]);

  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasPermission('dashboard')) {
      if (hasPermission('gestao')) {
        navigate('/monitor');
      }
    }
  }, [hasPermission, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const isAdminOrTI = user?.perfil === 'Administrador(a)' || user?.perfil === 'T.I';
      const companiesPromise = isAdminOrTI ? companies.getLight() : companies.getLightMy();

      const [allVotesRes, allCompaniesLight, allServiceTypes] = await Promise.all([
        votes.getAll(),
        companiesPromise.catch(() => [] as { id: string; nome: string; status: boolean }[]),
        serviceTypes.getAll(),
      ]);

      setTotalVotes(allVotesRes.length);
      setTotalCompanies(allCompaniesLight.length);
      setTotalServiceTypes(allServiceTypes.length);
      setAllVotes(allVotesRes);
      setCompaniesList(allCompaniesLight as Company[]);

      const companyVotesMap = new Map<string, number>();
      allVotesRes.forEach((vote: Vote) => {
        companyVotesMap.set(vote.id_empresa, (companyVotesMap.get(vote.id_empresa) || 0) + 1);
      });
      setCompanyVotes(
        allCompaniesLight.map((c) => ({
          name: c.nome,
          votes: companyVotesMap.get(c.id) || 0,
          id: c.id,
        }))
      );

      const serviceVotesMap = new Map<string, number>();
      allVotesRes.forEach((vote: Vote) => {
        const id = vote.id_tipo_servico || '';
        serviceVotesMap.set(id, (serviceVotesMap.get(id) || 0) + 1);
      });
      setServiceTypeVotes(
        allServiceTypes.map((s: ServiceType) => ({
          name: s.nome,
          votes: serviceVotesMap.get(s.id) || 0,
          id: s.id,
        }))
      );

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      setVotesData({
        today: allVotesRes.filter((v: Vote) => new Date(v.momento_voto) >= today).length,
        week: allVotesRes.filter((v: Vote) => new Date(v.momento_voto) >= weekAgo).length,
        month: allVotesRes.filter((v: Vote) => new Date(v.momento_voto) >= monthAgo).length,
      });

      if (!loading && allVotesRes.length > 0) {
        const latest = allVotesRes[0];
        const voteTime = new Date(latest.momento_voto);
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (voteTime > fiveMinAgo) {
          const company = allCompaniesLight.find((c) => c.id === latest.id_empresa);
          const service = allServiceTypes.find((s: ServiceType) => s.id === latest.id_tipo_servico);
          if (company && service) {
            toast.info(`Novo voto: ${company.nome} - ${service.nome}`, {
              icon: <Zap className="h-4 w-4" />,
              duration: 4000,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pb-12">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="space-y-1">
                <Skeleton className="h-8 w-48 sm:h-9 sm:w-56" />
                <Skeleton className="h-4 w-64 sm:w-80" />
              </div>
              <Skeleton className="h-10 w-full sm:w-36" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden border-0 shadow-sm bg-card">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-20" />
                  </CardHeader>
                </Card>
              ))}
            </div>
            <Card className="overflow-hidden border-0 shadow-sm bg-card">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[320px] sm:h-[400px] w-full rounded-lg" />
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              <div className="xl:col-span-2">
                <Card className="overflow-hidden border-0 shadow-sm bg-card">
                  <CardHeader>
                    <Skeleton className="h-6 w-44" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-[280px] sm:h-[320px] w-full rounded-lg" />
                  </CardContent>
                </Card>
              </div>
              <Card className="overflow-hidden border-0 shadow-sm bg-card">
                <CardHeader>
                  <Skeleton className="h-6 w-36" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-lg" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 sm:pb-12">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header com gradiente e saudação */}
          <div
            className={cn(
              'rounded-2xl sm:rounded-3xl p-6 sm:p-8',
              'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent',
              'border border-primary/10 dark:border-primary/20'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary mb-0.5 capitalize">
                  {todayFormatted}
                </p>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                  Dashboard
                </h1>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base max-w-xl">
                  Monitore votos e métricas das empresas em tempo real
                </p>
              </div>
              <Link to="/monitor" className="w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary/50"
                  size="default"
                >
                  <MonitorIcon className="h-4 w-4" />
                  Modo Monitor
                </Button>
              </Link>
            </div>
          </div>

          <NewsTicker votes={allVotes} companies={companiesList} />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {statCardsConfig.map((config, index) => (
              <Card
                key={config.key}
                className={cn(
                  'overflow-hidden border border-border/80 bg-card shadow-sm',
                  'transition-all duration-200 hover:shadow-md hover:border-primary/20',
                  'min-h-[120px] sm:min-h-[130px] flex flex-col'
                )}
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                  <div className="flex-1 min-w-0">
                    <CardDescription className="text-xs sm:text-sm">
                      {config.label}
                    </CardDescription>
                    {config.key === 'votes' && (
                      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                        <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums">
                          {totalVotes.toLocaleString('pt-BR')}
                        </CardTitle>
                        {config.badge && (
                          <span className="inline-flex items-center text-xs font-medium text-primary">
                            <ArrowUpRight className="h-3 w-3 mr-0.5" />
                            {config.badge}
                          </span>
                        )}
                      </div>
                    )}
                    {config.key === 'activity' && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Hoje</span>
                          <span className="font-semibold tabular-nums">{votesData.today}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Semana</span>
                          <span className="font-semibold tabular-nums">{votesData.week}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Mês</span>
                          <span className="font-semibold tabular-nums">{votesData.month}</span>
                        </div>
                      </div>
                    )}
                    {config.key === 'companies' && (
                      <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">
                        {totalCompanies.toLocaleString('pt-BR')}
                      </CardTitle>
                    )}
                    {config.key === 'services' && (
                      <CardTitle className="text-2xl sm:text-3xl font-bold tabular-nums mt-1">
                        {totalServiceTypes.toLocaleString('pt-BR')}
                      </CardTitle>
                    )}
                  </div>
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11',
                      config.iconBg
                    )}
                  >
                    <config.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Análise Detalhada */}
          <Card className="overflow-hidden border border-border/80 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg sm:text-xl">Análise Detalhada</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Distribuição por avaliação e tendência ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="min-h-[280px] sm:min-h-[360px] w-full overflow-x-auto">
                <VoteCharts votes={allVotes} companies={companiesList} />
              </div>
            </CardContent>
          </Card>

          {/* Gráfico + Votos Recentes */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2 min-w-0">
              <VoteChart
                data={companyVotes}
                title="Distribuição de Votos"
                description="Votos por empresa"
                height={280}
              />
            </div>
            <div className="min-w-0">
              <Card className="h-full overflow-hidden border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg sm:text-xl">Votos Recentes</CardTitle>
                  <CardDescription className="text-sm">
                    Últimas avaliações recebidas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <RecentVotes votes={allVotes} companies={companiesList} hideTitle />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
