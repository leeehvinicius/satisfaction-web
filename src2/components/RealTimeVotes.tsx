
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VoteCard from './VoteCard';
import { ProcessedVote } from '@/types/vote';
import { Vote } from '@/types/api';

interface RealTimeVotesProps {
  title?: string;
  maxItems?: number;
  highlightRecent?: boolean;
}

const RealTimeVotes: React.FC<RealTimeVotesProps> = ({
  title = "Votos Recentes",
  maxItems = 6,
  highlightRecent = true
}) => {
  const [votes, setVotes] = useState<ProcessedVote[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch votes data
  useEffect(() => {
    const fetchVotes = async () => {
      try {
        // Simulate API response with mock data
        const mockVotes = await getMockVotes();
        processVotes(mockVotes);
      } catch (error) {
        console.error("Error fetching votes:", error);
        setLoading(false);
      }
    };

    fetchVotes();

    // Setup polling for real-time updates
    const interval = setInterval(() => {
      fetchVotes();
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Process votes data
  const processVotes = (rawVotes: Vote[]) => {
    // Process and transform raw vote data
    let processedVotes: ProcessedVote[] = rawVotes.map(vote => ({
      id: vote.id,
      companyName: vote.company_name,
      serviceName: vote.service_type,
      timestamp: vote.created_at,
      count: vote.count,
      isRecent: highlightRecent && isRecentVote(vote.created_at)
    }));

    // Sort by timestamp (most recent first)
    processedVotes.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Limit to maxItems
    if (processedVotes.length > maxItems) {
      processedVotes = processedVotes.slice(0, maxItems);
    }

    setVotes(processedVotes);
    setLoading(false);
  };

  // Check if a vote is recent (within the last hour)
  const isRecentVote = (timestamp: string): boolean => {
    const voteTime = new Date(timestamp).getTime();
    const oneHourAgo = new Date().getTime() - (60 * 60 * 1000);
    return voteTime > oneHourAgo;
  };

  // Mock data function - replace with actual API call later
  const getMockVotes = async (): Promise<Vote[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Demo data with more variety
    return [
      {
        id: "1",
        company_name: "Empresa ABC",
        service_type: "Atendimento ao Cliente",
        created_at: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
        count: 15
      },
      {
        id: "2",
        company_name: "Tech Solutions",
        service_type: "Suporte Técnico",
        created_at: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
        count: 8
      },
      {
        id: "3",
        company_name: "Lojas Star",
        service_type: "Entrega",
        created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
        count: 22
      },
      {
        id: "4",
        company_name: "Mercado Express",
        service_type: "Qualidade do Produto",
        created_at: new Date(Date.now() - 3 * 60 * 60000).toISOString(), // 3 hours ago
        count: 5
      },
      {
        id: "5",
        company_name: "Banco Seguro",
        service_type: "Aplicativo Mobile",
        created_at: new Date(Date.now() - 5 * 60 * 60000).toISOString(), // 5 hours ago
        count: 17
      },
      {
        id: "6",
        company_name: "Streaming Plus",
        service_type: "Conteúdo",
        created_at: new Date(Date.now() - 8 * 60 * 60000).toISOString(), // 8 hours ago
        count: 10
      },
      {
        id: "7",
        company_name: "Telecomunicações XYZ",
        service_type: "Internet",
        created_at: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
        count: 31
      },
      {
        id: "8",
        company_name: "Restaurante Sabor",
        service_type: "Atendimento",
        created_at: new Date(Date.now() - 1.5 * 60 * 60000).toISOString(), // 1.5 hours ago
        count: 19
      }
    ];
  };

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          Últimos votos registrados no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(maxItems).fill(0).map((_, index) => (
              <div key={index} className="h-32 rounded-lg bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {votes.map(vote => (
              <VoteCard 
                key={vote.id}
                companyName={vote.companyName}
                serviceName={vote.serviceName}
                timestamp={vote.timestamp}
                count={vote.count}
                isRecent={vote.isRecent}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeVotes;
