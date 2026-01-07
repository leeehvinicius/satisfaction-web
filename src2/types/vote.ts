export interface Vote {
  id_voto: string;
  id_empresa: string;
  id_tipo_servico: string | null;
  avaliacao: 'Ótimo' | 'Bom' | 'Regular' | 'Ruim';
  comentario: string | null;
  status: boolean;
  momento_voto: string;
  updated_at: string;
}

export interface ServiceInfo {
  nome: string;
  tipo_servico: string;
  hora_inicio: string;
  hora_final: string;
}

export interface ServiceVotes {
  total: number;
  avaliacoes: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  percentuais: {
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
  };
  votes: Vote[];
  serviceInfo: ServiceInfo | null;
}

export interface VoteAnalytics {
  totalVotes: number;
  avaliacoesPorTipo: Record<string, number>;
  percentuaisPorTipo: Record<string, number>;
  votesByService: Record<string, {
    total: number;
    avaliacoes: Record<string, number>;
    percentuais: Record<string, number>;
    serviceInfo?: {
      nome: string;
      hora_inicio: string;
      hora_final: string;
      qtd_ref?: number;
    };
  }>;
  votesByDay: {
    data: string;
    empresa: string;
    Ótimo: number;
    Bom: number;
    Regular: number;
    Ruim: number;
    total: number;
  }[];
  votosNegativos?: {
    id_voto: string;
    id_empresa: string;
    id_tipo_servico: string | null;
    avaliacao: 'Regular' | 'Ruim';
    comentario: string | null;
    momento_voto: string;
    tipo_servico?: {
      nome: string;
    };
  }[];
}

export interface ProcessedVote {
  id: string;
  companyName: string;
  serviceName: string;
  timestamp: string;
  count: number;
  isRecent: boolean;
}

export interface CompanyVoteAnalytics {
  companyId: string;
  companyName: string;
  totalVotes: number;
  serviceBreakdown: { service: string; count: number }[];
  votesTrend: { date: string; count: number }[];
  satisfaction: number; // percentage from 0-100
}
