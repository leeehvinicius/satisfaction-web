import { Company } from './company';

export interface Permission {
  id: string;
  permission: string;
  has_permission: boolean;
  user_id: string;
}

export interface PermissionCategory {
  name: string;
  permissions: {
    key: string;
    label: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Menu Principal',
    permissions: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'gestao', label: 'Monitor' },
      { key: 'cadastros_companies', label: 'Empresas' },
      { key: 'cadastros_service_types', label: 'Tipos de Serviço' },
      { key: 'pesquisas_votes', label: 'Votos' },
      { key: 'autorizacoes_users', label: 'Usuários' },
      { key: 'relatorios', label: 'Relatórios' },
    ],

  },




];

export interface User {
  id: string;
  username: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas: Company[];
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas?: {
    id_empresa: string;
    nome_empresa: string;
    status: boolean;
  }[];
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  email?: string;
  nome?: string;
  cargo?: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso?: string;
  empresas?: {
    id_empresa: string;
    nome_empresa: string;
    status: boolean;
  }[];
}

export interface UserFormData {
  username: string;
  password: string;
  email: string;
  nome: string;
  cargo: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso: string;
  empresas: string[]; // IDs das empresas
}

export interface UserFormDataUpdate {
  username?: string;
  password?: string;
  email?: string;
  nome?: string;
  cargo?: string;
  telcel?: string;
  setor?: string;
  image?: string;
  perfil_acesso?: string;
  empresas?: string[]; // IDs das empresas
}

export interface UserResponse {
  access_token: string;
  user: User;
}

export interface AccessProfile {
  value: string;
  label: string;
} 