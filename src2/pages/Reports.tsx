import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { companies, votes } from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Company {
  id: string;
  nome: string;
}

interface Vote {
  id_voto: string;
  id_empresa: string;
  id_tipo_servico: string | null;
  avaliacao: string;
  comentario: string | null;
  status: boolean;
  momento_voto: string;
  updated_at: string;
}

interface Service {
  id: string;
  id_empresa: string;
  tipo_servico: string;
  nome: string;
  hora_inicio: string;
  hora_final: string;
  status: boolean;
  user_add: string;
  date_add: string;
}

const Reports: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [period, setPeriod] = useState<'day' | 'month' | 'year'>('day');
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  // Buscar empresas
  const { data: companiesData = [] } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: () => companies.getAll()
  });

  // Buscar votos da empresa selecionada
  const { data: votesData = [] } = useQuery<Vote[]>({
    queryKey: ['votes', selectedCompany],
    queryFn: () => votes.getByCompany(selectedCompany),
    enabled: !!selectedCompany
  });

  // Buscar serviços da empresa selecionada
  const { data: servicesData = [] } = useQuery<Service[]>({
    queryKey: ['services', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Token não encontrado');

      // const response = await fetch(`https://api.vvrefeicoes.com.br/companies/${selectedCompany}/services`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/companies/${selectedCompany}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar serviços');
      return response.json();
    },
    enabled: !!selectedCompany
  });

  // Processar dados para os gráficos
  const voteData = React.useMemo(() => {
    if (!selectedCompany || !votesData.length) return [
      { name: 'Ótimo', value: 0 },
      { name: 'Bom', value: 0 },
      { name: 'Regular', value: 0 },
      { name: 'Ruim', value: 0 }
    ];

    const counts = votesData.reduce((acc, vote) => {
      switch (vote.avaliacao) {
        case 'Ótimo':
          acc.otimo++;
          break;
        case 'Bom':
          acc.bom++;
          break;
        case 'Regular':
          acc.regular++;
          break;
        case 'Ruim':
          acc.ruim++;
          break;
      }
      return acc;
    }, { otimo: 0, bom: 0, regular: 0, ruim: 0 });

    return [
      { name: 'Ótimo', value: counts.otimo },
      { name: 'Bom', value: counts.bom },
      { name: 'Regular', value: counts.regular },
      { name: 'Ruim', value: counts.ruim }
    ];
  }, [votesData, selectedCompany]);

  // Processar dados para o gráfico de tipos de serviço
  const serviceTypeData = React.useMemo(() => {
    if (!selectedCompany || !votesData.length || !servicesData.length) return [];

    const serviceCounts = votesData.reduce((acc, vote) => {
      const service = servicesData.find(s => s.id === vote.id_tipo_servico);
      const serviceName = service ? service.nome : 'Sem Tipo';
      if (!acc[serviceName]) {
        acc[serviceName] = 0;
      }
      acc[serviceName]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(serviceCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [votesData, selectedCompany, servicesData]);

  const COLORS = ['#22c55e', '#4ade80', '#eab308', '#ef4444'];

  // Dados de exemplo para os outros gráficos (substitua por dados reais quando disponíveis)
  const companyData = [
    { name: 'Empresa A', votos: 120, satisfacao: 85 },
    { name: 'Empresa B', votos: 90, satisfacao: 78 },
    { name: 'Empresa C', votos: 150, satisfacao: 92 },
    { name: 'Empresa D', votos: 80, satisfacao: 70 },
  ];

  const userData = [
    { name: 'Jan', usuarios: 50, votos: 120 },
    { name: 'Fev', usuarios: 65, votos: 150 },
    { name: 'Mar', usuarios: 80, votos: 180 },
    { name: 'Abr', usuarios: 95, votos: 200 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="flex gap-4">
          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {companiesData.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Tabs defaultValue="day" onValueChange={(value) => setPeriod(value as 'day' | 'month' | 'year')}>
            <TabsList>
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
              <TabsTrigger value="year">Ano</TabsTrigger>
            </TabsList>
          </Tabs>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribuição de Votos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voteData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {voteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Votos por Tipo de Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Total de Votos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Desempenho por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votos" fill="#8884d8" name="Total de Votos" />
                  <Bar dataKey="satisfacao" fill="#82ca9d" name="Satisfação (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Evolução de Usuários e Votos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="usuarios" stroke="#8884d8" name="Usuários" />
                  <Line type="monotone" dataKey="votos" stroke="#82ca9d" name="Votos" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports; 