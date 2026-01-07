
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ThumbsUp, Clock } from 'lucide-react';

interface VoteCardProps {
  companyName: string;
  serviceName: string;
  timestamp: string;
  count: number;
  isRecent?: boolean;
}

const VoteCard: React.FC<VoteCardProps> = ({ 
  companyName, 
  serviceName, 
  timestamp, 
  count,
  isRecent = false 
}) => {
  // Format the timestamp to a readable format
  const formattedTime = new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Card className={`glass-card overflow-hidden transition-all duration-500 h-full ${isRecent ? 'border-primary/50 shadow-md shadow-primary/10' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold">{companyName}</CardTitle>
          {isRecent && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse-subtle">
              <Clock className="mr-1 h-3 w-3" />
              Recente
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Serviço: {serviceName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-lg font-medium">
          <ThumbsUp className="h-5 w-5 text-primary" />
          <span>{count}</span>
          <span className="text-sm text-muted-foreground ml-1">votos</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground flex justify-between items-center">
        <span>{formattedTime}</span>
        {count > 10 && (
          <Badge variant="secondary" className="bg-secondary/80 text-xs">
            <Check className="mr-1 h-3 w-3" />
            Popular
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
};

export default VoteCard;
