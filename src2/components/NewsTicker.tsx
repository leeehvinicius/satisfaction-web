import React from 'react';
import { Vote } from '@/types/vote';
import { Company } from '@/types/company';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewsTickerProps {
  votes: Vote[];
  companies: Company[];
}

const getRatingEmoji = (avaliacao: string) => {
  switch (avaliacao) {
    case 'Ótimo':
      return '⭐';
    case 'Bom':
      return '👍';
    case 'Regular':
      return '😐';
    case 'Ruim':
      return '👎';
    default:
      return '❓';
  }
};

const getRatingColor = (avaliacao: string) => {
  switch (avaliacao) {
    case 'Ótimo':
      return 'text-yellow-500';
    case 'Bom':
      return 'text-green-500';
    case 'Regular':
      return 'text-orange-500';
    case 'Ruim':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

export const NewsTicker: React.FC<NewsTickerProps> = ({ votes, companies }) => {
  // Função para obter o nome do serviço
  const getServiceName = (vote: Vote) => {
    if (!companies || companies.length === 0) return 'Carregando...';
    const company = companies.find(c => c.id === vote.id_empresa);
    if (!company) return 'Empresa não encontrada';
    if (!company.servicos) return 'Serviços não disponíveis';
    const service = company.servicos.find(s => s.id === vote.id_tipo_servico);
    return service?.nome || 'Serviço não encontrado';
  };

  return (
    <div className="w-full overflow-hidden bg-muted/50 py-2">
      <div className="flex animate-ticker whitespace-nowrap">
        {votes.map((vote, index) => (
          <div
            key={`${vote.id_voto}-${index}`}
            className="mx-4 inline-flex items-center space-x-2 rounded-full bg-background px-4 py-1 text-sm shadow-sm"
          >
            <span className="font-medium">{getServiceName(vote)}</span>
            <span className={`text-lg ${getRatingColor(vote.avaliacao)}`}>
              {getRatingEmoji(vote.avaliacao)}
            </span>
            <span className="text-muted-foreground">{vote.avaliacao}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(vote.momento_voto), "d 'de' MMMM, 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}; 