// Base API response interface
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// User interface
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  created_at: string;
}

// Registration request interface
export interface PerfilAcesso {
  nome: string;
  status: boolean;
}

export interface Empresa {
  id_empresa: string;
  nome_empresa: string;
  status: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  nome: string;
  cargo: string;
  perfil_acesso: string;
  telcel?: string;
}

// Login request interface
export interface LoginRequest {
  username: string;
  password: string;
}

// Auth response interface
export interface AuthResponse {
  token: string;
  user: User;
}

// Vote interface for API responses
export interface Vote {
  id: string;
  company_name: string;
  service_type: string;
  created_at: string;
  count: number;
}

// Company interface
export interface Company {
  id: string;
  name: string;
  description: string;
  created_at: string;
  analytics?: {
    totalVotes: number;
    votesPerDay: { date: string; count: number }[];
    satisfaction: number; // percentage
  };
}

// Service Type interface
export interface ServiceType {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

// Monitor configuration
export interface MonitorConfig {
  refreshInterval: number; // in seconds
  displayMode: 'standard' | 'tv';
  highlightThreshold: number;
  showCompanies: boolean;
  showServices: boolean;
  showRecentVotes: boolean;
}
