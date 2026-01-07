import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, subDays, subHours, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Vote } from '@/types/vote';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VoteFloatingBarsProps {
  votes: Vote[];
  height?: number;
}

type TimeFilter = 'day' | 'week' | 'month';

const VoteFloatingBars: React.FC<VoteFloatingBarsProps> = ({ votes, height = 300 }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('day');

  const getRatingValue = (avaliacao: string): number => {
    switch (avaliacao) {
      case 'Ótimo':
        return 5;
      case 'Bom':
        return 4;
      case 'Regular':
        return 3;
      case 'Ruim':
        return 2;
      default:
        return 0;
    }
  };

  const getRatingColor = (avaliacao: string) => {
    switch (avaliacao) {
      case 'Ótimo':
        return 'rgb(34, 197, 94)'; // green-500
      case 'Bom':
        return 'rgb(59, 130, 246)'; // blue-500
      case 'Regular':
        return 'rgb(234, 179, 8)'; // yellow-500
      case 'Ruim':
        return 'rgb(239, 68, 68)'; // red-500
      default:
        return 'rgb(156, 163, 175)'; // gray-400
    }
  };

  const getFilteredVotes = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'day':
        startDate = subHours(now, 24);
        break;
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      default:
        startDate = subHours(now, 24);
    }

    return votes.filter(vote => 
      isWithinInterval(new Date(vote.momento_voto), { start: startDate, end: now })
    );
  };

  const filteredVotes = getFilteredVotes();

  // Ordenar votos por data
  const sortedVotes = [...filteredVotes].sort((a, b) => 
    new Date(a.momento_voto).getTime() - new Date(b.momento_voto).getTime()
  );

  const data = {
    labels: sortedVotes.map(vote => 
      format(new Date(vote.momento_voto), "HH:mm", { locale: ptBR })
    ),
    datasets: [
      {
        label: 'Avaliação',
        data: sortedVotes.map(vote => getRatingValue(vote.avaliacao)),
        backgroundColor: sortedVotes.map(vote => getRatingColor(vote.avaliacao)),
        barThickness: 20,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const vote = sortedVotes[context.dataIndex];
            return [
              `Serviço: ${vote.serviceType?.nome}`,
              `Avaliação: ${vote.avaliacao}`,
              `Horário: ${format(new Date(vote.momento_voto), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value: number) => {
            switch (value) {
              case 5:
                return 'Ótimo';
              case 4:
                return 'Bom';
              case 3:
                return 'Regular';
              case 2:
                return 'Ruim';
              default:
                return '';
            }
          },
        },
      },
      x: {
        display: true,
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Últimas 24 horas</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default VoteFloatingBars; 