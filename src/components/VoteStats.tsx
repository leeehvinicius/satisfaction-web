import React from 'react';
import { Vote } from '@/types/vote';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VoteStatsProps {
  votes: Vote[];
  qtdbutao: number;
  counts?: {
    otimo: number;
    bom: number;
    regular: number;
    ruim: number;
    total: number;
  };
}

const VoteStats: React.FC<VoteStatsProps> = ({ votes, qtdbutao, counts }) => {
  const statsFromVotes = {
    total: votes.length,
    otimo: votes.filter((v) => v.avaliacao === 'Ótimo').length,
    bom: votes.filter((v) => v.avaliacao === 'Bom').length,
    regular: votes.filter((v) => v.avaliacao === 'Regular').length,
    ruim: votes.filter((v) => v.avaliacao === 'Ruim').length,
  };

  const stats = counts && typeof counts.total === 'number' ? counts : statsFromVotes;

  const satisfactionRate = stats.total > 0
    ? ((stats.otimo + stats.bom) / stats.total) * 100
    : 0;

  const getPercentage = (value: number) => {
    return stats.total > 0 ? (value / stats.total) * 100 : 0;
  };

  const progressTrackClass = "!bg-muted";

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${qtdbutao === 4 ? "xl:grid-cols-6" : ""} gap-3 sm:gap-4 w-full max-w-none`}
    >
      {/* Satisfação Geral */}
      <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">😋</span>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Satisfação</p>
              <p className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tabular-nums">{satisfactionRate.toFixed(1)}%</p>
            </div>
            <Progress value={satisfactionRate} className={cn("w-full h-1.5", progressTrackClass)} />
          </div>
        </CardContent>
      </Card>

      {/* Ótimo */}
      <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-green-500/5 to-green-500/10 dark:from-green-500/10 dark:to-green-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">😋</span>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Ótimo</p>
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-green-500 tabular-nums">{stats.otimo}</p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">{getPercentage(stats.otimo).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.otimo)} className={cn("w-full h-1.5", progressTrackClass)} />
          </div>
        </CardContent>
      </Card>

      {/* Bom */}
      <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">😃</span>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Bom</p>
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-blue-500 tabular-nums">{stats.bom}</p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">{getPercentage(stats.bom).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.bom)} className={cn("w-full h-1.5", progressTrackClass)} />
          </div>
        </CardContent>
      </Card>

      {/* Regular */}
      <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 dark:from-yellow-500/10 dark:to-yellow-500/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">😐</span>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Regular</p>
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-yellow-500 tabular-nums">{stats.regular}</p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">{getPercentage(stats.regular).toFixed(1)}%</p>
            </div>
            <Progress value={getPercentage(stats.regular)} className={cn("w-full h-1.5", progressTrackClass)} />
          </div>
        </CardContent>
      </Card>

      {/* Ruim */}
      {qtdbutao === 4 && (
        <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-red-500/5 to-red-500/10 dark:from-red-500/10 dark:to-red-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col items-center text-center space-y-1">
              <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">😢</span>
              <div className="space-y-0.5">
                <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Ruim</p>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-red-500 tabular-nums">{stats.ruim}</p>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">{getPercentage(stats.ruim).toFixed(1)}%</p>
              </div>
              <Progress value={getPercentage(stats.ruim)} className={cn("w-full h-1.5", progressTrackClass)} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total */}
      <Card className="min-h-[200px] sm:min-h-[240px] border border-border bg-card bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col items-center text-center space-y-1">
            <span className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl">📊</span>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-2xl md:text-3xl lg:text-4xl text-muted-foreground">Total</p>
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tabular-nums">{stats.total}</p>
              <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground">Votos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoteStats;
