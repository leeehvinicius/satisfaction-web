import React from 'react';
import { Vote } from '@/types/vote';
import { Company } from '@/types/company';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Pie, Line, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VoteChartsProps {
  votes: Vote[];
  companies: Company[];
}

export const VoteCharts: React.FC<VoteChartsProps> = ({ votes, companies }) => {
  // Função para obter o nome do serviço
  const getServiceName = (vote: Vote) => {
    if (!companies || companies.length === 0) return 'Carregando...';
    const company = companies.find(c => c.id === vote.id_empresa);
    if (!company) return 'Empresa não encontrada';
    if (!company.servicos) return 'Serviços não disponíveis';
    const service = company.servicos.find(s => s.id === vote.id_tipo_servico);
    return service?.nome || 'Serviço não encontrado';
  };

  // Dados para o gráfico de pizza
  const pieData = {
    labels: ['Ótimo', 'Bom', 'Regular', 'Ruim'],
    datasets: [
      {
        data: [
          votes.filter(v => v.avaliacao === 'Ótimo').length,
          votes.filter(v => v.avaliacao === 'Bom').length,
          votes.filter(v => v.avaliacao === 'Regular').length,
          votes.filter(v => v.avaliacao === 'Ruim').length,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
      },
    ],
  };

  // Dados para o gráfico de linha
  const lineData = {
    labels: votes.map(vote => format(new Date(vote.momento_voto), 'dd/MM', { locale: ptBR })),
    datasets: [
      {
        label: 'Avaliações',
        data: votes.map(vote => {
          switch (vote.avaliacao) {
            case 'Ótimo': return 4;
            case 'Bom': return 3;
            case 'Regular': return 2;
            case 'Ruim': return 1;
            default: return 0;
          }
        }),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Dados para o gráfico de barras
  const serviceVotes = votes.reduce((acc, vote) => {
    const serviceName = getServiceName(vote);
    acc[serviceName] = (acc[serviceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = {
    labels: Object.keys(serviceVotes),
    datasets: [
      {
        label: 'Votos por Serviço',
        data: Object.values(serviceVotes),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Distribuição de Avaliações</h3>
        <div className="h-[300px]">
          <Pie data={pieData} options={chartOptions} />
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Tendência de Avaliações</h3>
        <div className="h-[300px]">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Votos por Serviço</h3>
        <div className="h-[300px]">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}; 