import React, { useEffect } from 'react';
import { Vote } from '@/types/vote';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VoteStatsProps {
  votes: Vote[];
  qtdbutao: number;
}


const VoteStats: React.FC<VoteStatsProps> = ({ votes, qtdbutao }) => {
  console.log('VoteStats received votes:', votes);
  console.log('VoteStats votes length:', votes.length);
  console.log('VoteStats votes types:', votes.map(v => v.avaliacao));
  console.log('VoteStats votes details:', votes.map(v => ({
    avaliacao: v.avaliacao,
    momento_voto: v.momento_voto,
    id_tipo_servico: v.id_tipo_servico
  })));

  useEffect(() => {
    console.log('VoteStats votes changed:', votes);
    console.log('VoteStats votes changed length:', votes.length);
    console.log('VoteStats votes changed details:', votes.map(v => ({
      avaliacao: v.avaliacao,
      momento_voto: v.momento_voto,
      id_tipo_servico: v.id_tipo_servico
    })));
  }, [votes]);

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
        return 'text-green-500';
      case 'Bom':
        return 'text-blue-500';
      case 'Regular':
        return 'text-yellow-500';
      case 'Ruim':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const stats = {
    total: votes.length,
    otimo: votes.filter(v => v.avaliacao === 'Ótimo').length,
    bom: votes.filter(v => v.avaliacao === 'Bom').length,
    regular: votes.filter(v => v.avaliacao === 'Regular').length,
    ruim: votes.filter(v => v.avaliacao === 'Ruim').length,
  };

  console.log('Calculated stats:', stats);

  const satisfactionRate = stats.total > 0
    ? ((stats.otimo + stats.bom) / stats.total) * 100
    : 0;

  const averageRating = stats.total > 0
    ? votes.reduce((acc, vote) => acc + getRatingValue(vote.avaliacao), 0) / stats.total
    : 0;

  console.log('Calculated rates:', {
    satisfactionRate,
    averageRating
  });

  const getPercentage = (value: number) => {
    return stats.total > 0 ? (value / stats.total) * 100 : 0;
  };

  return (
    <div className={`grid ${qtdbutao === 4 ? 'grid-cols-6' : 'grid-cols-5'} gap-4 w-full max-w-none`}>
      {/* Satisfação Geral */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 min-h-[280px]">
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-8xl">😋</span>
            <div className="space-y-0.5">
              <p className="text-4xl text-muted-foreground">Satisfação</p>
              <p className="text-7xl font-bold">{satisfactionRate.toFixed(1)}%</p>
            </div>
            <Progress value={satisfactionRate} className="w-full h-1" />
          </div>
        </CardContent>
      </Card>

      {/* Ótimo */}
      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 min-h-[280px]">
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-8xl">😋</span>
            <div className="space-y-0.5">
              <p className="text-4xl text-muted-foreground">Ótimo</p>
              <p className="text-6xl font-bold text-green-500">{stats.otimo}</p>
              <p className="text-3xl text-muted-foreground">{getPercentage(stats.otimo).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.otimo)} className="w-full h-1 bg-green-100" />
          </div>
        </CardContent>
      </Card>

      {/* Bom */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 min-h-[280px]" >
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-8xl">😃</span>
            <div className="space-y-0.5">
              <p className="text-4xl text-muted-foreground">Bom</p>
              <p className="text-6xl font-bold text-blue-500">{stats.bom}</p>
              <p className="text-3xl text-muted-foreground">{getPercentage(stats.bom).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.bom)} className="w-full h-1 bg-blue-100" />
          </div>
        </CardContent>
      </Card>

      {/* Regular */}
      <Card className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 min-h-[280px]">
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-8xl">😐</span>
            <div className="space-y-0.5">
              <p className="text-4xl text-muted-foreground">Regular</p>
              <p className="text-6xl font-bold text-yellow-500">{stats.regular}</p>
              <p className="text-3xl text-muted-foreground">{getPercentage(stats.regular).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.regular)} className="w-full h-1 bg-yellow-100" />
          </div>
        </CardContent>
      </Card>

      {/* Ruim */}
      {qtdbutao === 4 && (
        <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 min-h-[280px]">
          <CardContent className="pt-4">
            <div className="flex flex-col items-center text-center space-y-1">
              <span className="text-8xl">😢</span>
              <div className="space-y-0.5">
                <p className="text-4xl text-muted-foreground">Ruim</p>
                <p className="text-6xl	 font-bold text-red-500">{stats.ruim}</p>
                <p className="text-3xl text-muted-foreground">{getPercentage(stats.ruim).toFixed(1)}%</p>
              </div>
              <Progress value={getPercentage(stats.ruim)} className="w-full h-1 bg-red-100" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 min-h-[280px]">
        <CardContent className="pt-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-8xl">📊</span>
            <div className="space-y-0.5">
              <p className="text-4xl text-muted-foreground">Total</p>
              <p className="text-6xl	 font-bold">{stats.total}</p>
              <p className="text-3xl text-muted-foreground">Votos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteStats; 