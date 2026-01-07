
import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  CartesianGrid,
  LabelList 
} from 'recharts';

interface VoteChartProps {
  data: Array<{
    name: string;
    votes: number;
    id: string;
  }>;
  title: string;
  description?: string;
  height?: number;
}

const VoteChart: React.FC<VoteChartProps> = ({ 
  data, 
  title, 
  description, 
  height = 300 
}) => {
  // Sort data by votes in descending order
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.votes - a.votes);
  }, [data]);

  // Calculate max value for yAxis domain
  const maxVotes = useMemo(() => {
    if (data.length === 0) return 10;
    return Math.max(...data.map(item => item.votes)) * 1.2; // Add 20% padding
  }, [data]);

  // Generate colors based on position (higher votes get more saturated colors)
  const getBarColor = (index: number) => {
    const colors = [
      '#0088FE', // blue
      '#00C49F', // green
      '#FFBB28', // yellow
      '#FF8042', // orange
      '#8884D8', // purple
      '#26A69A', // teal
      '#EF5350', // red
      '#AB47BC'  // violet
    ];
    
    return colors[index % colors.length];
  };

  return (
    <Card className="glass-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pl-0">
        <div className="h-[300px] w-full" style={{ height }}>
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sortedData} 
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  domain={[0, maxVotes]}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="votes" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {sortedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                  <LabelList dataKey="votes" position="top" fill="hsl(var(--card-foreground))" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoteChart;
