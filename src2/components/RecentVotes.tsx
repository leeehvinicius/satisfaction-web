import React from 'react';
import { Vote } from '@/types/vote';
import { Company } from '@/types/company';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Star } from 'lucide-react';

interface RecentVotesProps {
  votes: Vote[];
  companies: Company[];
}

const getRatingStars = (avaliacao: string) => {
  switch (avaliacao) {
    case 'Ótimo':
      return 4;
    case 'Bom':
      return 3;
    case 'Regular':
      return 2;
    case 'Ruim':
      return 1;
    default:
      return 0;
  }
};

export const RecentVotes: React.FC<RecentVotesProps> = ({ votes, companies }) => {
  // Função para obter o nome do serviço
  const getServiceName = (vote: Vote) => {
    if (!companies || companies.length === 0) return 'Carregando...';
    const company = companies.find(c => c.id === vote.id_empresa);
    if (!company) return 'Empresa não encontrada';
    if (!company.servicos) return 'Serviços não disponíveis';
    const service = company.servicos.find(s => s.id === vote.id_tipo_servico);
    return service?.nome || 'Serviço não encontrado';
  };

  // return (
  //   <div className="space-y-4">
  //     <h3 className="text-lg font-semibold">Votos Recentes</h3>
  //     <div className="space-y-4">
  //       {votes.length === 0 ? (
  //         <div className="text-center py-8 text-muted-foreground">
  //           Nenhum voto recente
  //         </div>
  //       ) : (
  //         votes.map((vote) => (
  //           <div
  //             key={vote.id_voto}
  //             className="flex items-start justify-between rounded-lg border p-4"
  //           >
  //             <div className="space-y-1">
  //               <div className="flex items-center space-x-2">
  //                 <span className="font-medium">{getServiceName(vote)}</span>
  //                 <span className="text-sm text-muted-foreground">
  //                   {vote.avaliacao}
  //                 </span>
  //               </div>
  //               <div className="flex items-center space-x-1">
  //                 {[...Array(4)].map((_, index) => (
  //                   <Star
  //                     key={index}
  //                     className={`h-4 w-4 ${
  //                       index < getRatingStars(vote.avaliacao)
  //                         ? 'fill-yellow-400 text-yellow-400'
  //                         : 'fill-muted text-muted'
  //                     }`}
  //                   />
  //                 ))}
  //               </div>
  //               <p className="text-sm text-muted-foreground line-clamp-2">
  //                 {vote.comentario}
  //               </p>
  //             </div>
  //             <span className="text-xs text-muted-foreground">
  //               {format(new Date(vote.momento_voto), "d 'de' MMMM, 'às' HH:mm", {
  //                 locale: ptBR,
  //               })}
  //             </span>
  //           </div>
  //         ))
  //       )}
  //     </div>
  //   </div>
  // );
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Votos Recentes</h3>
  
      <div className="rounded-lg border bg-background max-h-[400px] overflow-y-auto p-4 space-y-4">
        {votes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum voto recente
          </div>
        ) : (
          votes.map((vote) => (
            <div
              key={vote.id_voto}
              className="flex items-start justify-between rounded-md border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{getServiceName(vote)}</span>
                  <span className="text-sm text-muted-foreground">
                    {vote.avaliacao}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(4)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${
                        index < getRatingStars(vote.avaliacao)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-muted text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vote.comentario}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(vote.momento_voto), "d 'de' MMMM, 'às' HH:mm", {
                  locale: ptBR,
                })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
}; 