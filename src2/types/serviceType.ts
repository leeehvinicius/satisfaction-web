export interface ServiceType {
  id: string;
  id_empresa: string;
  tipo_servico: string;
  nome: string;
  hora_inicio: string;
  hora_final: string;
  user_add: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceTypeRequest {
  id_empresa: string;
  tipo_servico: string;
  nome: string;
  hora_inicio: string;
  hora_final: string;
  user_add: string;
}

export interface UpdateServiceTypeRequest {
  tipo_servico?: string;
  nome?: string;
  hora_inicio?: string;
  hora_final?: string;
  user_add: string;
} 