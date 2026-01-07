import axios from 'axios';
import { Vote, VoteAnalytics } from '../types/vote';
import { Company, CompanyService, CreateCompanyRequest, UpdateCompanyRequest, CreateCompanyServiceRequest } from '../types/company';
import { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest } from '../types/serviceType';
import { CreateUserRequest, UpdateUserRequest } from '../types/user';
import { Permission } from '../types/permission';
import { Service } from '../types/service';
import { QueryClient } from '@tanstack/react-query';

// Create an axios instance with base configurations
const API_URL = import.meta.env.VITE_API_URL || 'https://api.vvrefeicoes.com.br';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on the login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create a query client with default options
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // Cache is kept for 30 minutes (garbage collection time)
      retry: 1, // Only retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
    },
  },
});

// Authentication APIs
export const auth = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (userData: {
    username: string;
    password: string;
    email: string;
    nome: string;
    cargo: string;
    perfil_acesso: string;
  }) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  getUserPermissions: async (userId: string) => {
    const response = await api.get(`/users/${userId}/permissions`);
    return response.data;
  }
};

// Users APIs
export const users = {
  getAll: () => api.get('/users').then((response) => response.data),
  getById: (id: string) => api.get(`/users/${id}?include=empresas`).then((response) => response.data),
  getByUsername: (username: string) =>
    api.get(`/users/username/${username}`).then((response) => response.data),
  create: (data: CreateUserRequest) =>
    api.post('/users', data).then((response) => response.data),
  update: async (id: string, data: UpdateUserRequest) => {
    console.log('Chamando API de atualização:', { id, data });
    const response = await api.put(`/users/${id}`, data);
    console.log('Resposta da API:', response.data);
    return response.data;
  },
  delete: (id: string) => api.delete(`/users/${id}`).then((response) => response.data),
  getAccessProfiles: () => api.get('/users/access-profiles').then((response) => response.data),
  getPermissions: async (userId: string): Promise<Permission[]> => {
    const response = await api.get(`/users/${userId}/permissions`);
    return response.data;
  },
  updatePermission: async (userId: string, permission: string, has_permission: boolean) => {
    const response = await api.put(`/users/${userId}/permissions`, {
      permission,
      has_permission
    });
    return response.data;
  },
  linkToCompany: async (userId: string, companyId: string) => {
    const response = await api.post(`/companies/${companyId}/users/${userId}`);
    return response.data;
  },
  unlinkFromCompany: async (userId: string, companyId: string) => {
    const response = await api.delete(`/companies/${companyId}/users/${userId}`);
    return response.data;
  },
};

// Service Types APIs
export const serviceTypes = {
  create: async (data: CreateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.post('/service-types', data);
    return response.data;
  },
  getAll: async (): Promise<ServiceType[]> => {
    try {
      const response = await api.get('/service-types');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar tipos de serviço');
      }
      throw error;
    }
  },
  getById: async (id: string): Promise<ServiceType> => {
    const response = await api.get(`/service-types/${id}`);
    return response.data;
  },
  update: async (id: string, data: UpdateServiceTypeRequest): Promise<ServiceType> => {
    const response = await api.patch(`/service-types/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/service-types/${id}`);
  },
};

// Companies APIs
export const companies = {
  getAll: async (): Promise<Company[]> => {
    const response = await api.get('/companies');
    return response.data;
  },

  getMine: async (): Promise<Company[]> => {
    const response = await api.get('/companies/my/my');
    return response.data;
  },

  getById: async (id: string): Promise<Company> => {
    // Use the cached companies data if available
    const cachedCompanies = queryClient.getQueryData<Company[]>(['companies']);
    if (cachedCompanies) {
      const company = cachedCompanies.find(c => c.id === id);
      if (company) return company;
    }
    
    // Fallback to API request if not in cache
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  create: async (data: CreateCompanyRequest): Promise<Company> => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCompanyRequest): Promise<Company> => {
    // const response = await api.patch(`/companies/${id}`, data);
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/companies/${id}`);
  },

  getLines: async (): Promise<{ value: number; label: string }[]> => {
    const response = await api.get('/companies/lines');
    return response.data;
  },

  updateLine: async (id: string, linha: number): Promise<Company> => {
    const response = await api.patch(`/companies/${id}`, { linha });
    return response.data;
  },

  getServices: async (companyId: string): Promise<Service[]> => {
    const response = await api.get(`/companies/${companyId}/services`);
    return response.data;
  },

  addService: async (id: string, data: CreateCompanyServiceRequest): Promise<CompanyService> => {
    const response = await api.post(`/companies/${id}/services`, data);
    return response.data;
  },

  updateService: async (companyId: string, serviceId: string, data: Partial<CreateCompanyServiceRequest>): Promise<CompanyService> => {
    const response = await api.patch(`/companies/${companyId}/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (companyId: string, serviceId: string): Promise<void> => {
    await api.delete(`/companies/${companyId}/services/${serviceId}`);
  }
};

// Votes APIs
export const votes = {
  create: async (data: {
    id_empresa: string;
    id_tipo_servico: string;
    avaliacao: string;
    comentario?: string;
  }) => {
    const response = await api.post('/votes', data);
    return response.data;
  },
  getAll: async (): Promise<Vote[]> => {
    try {
      // Fetch votes and companies in parallel
      const [votesResponse, allCompanies] = await Promise.all([
        api.get('/votes'),
        companies.getAll().catch(error => {
          console.error('Erro ao carregar empresas:', error);
          return [] as Company[];
        })
      ]);
      
      const votes = votesResponse.data;
      
      // Create a map of companies for quick lookup
      const companiesMap = new Map<string, Company>(
        allCompanies.map(company => [company.id, company] as [string, Company])
      );
      
      // Map votes with company data using the lookup map
      const votesWithCompany = votes.map((vote: Vote) => ({
        ...vote,
        company: companiesMap.get(vote.id_empresa)
      }));

      return votesWithCompany;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Falha ao buscar votos');
      }
      throw error;
    }
  },
  getAnalytics: async (companyId: string, filters?: {
    startDate?: string;
    endDate?: string;
    quickFilter?: string;
  }): Promise<VoteAnalytics> => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.quickFilter) params.append('quickFilter', filters.quickFilter);

      const response = await api.get(`/votes/analytics/${companyId}?${params.toString()}`);

      if (!response.data) {
        throw new Error('Nenhum dado retornado da API');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Não autorizado. Por favor, faça login novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao buscar análises');
      }
      throw error;
    }
  },
  getAnalyticsRelatorio: async (companyId: string, filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<VoteAnalytics> => {
    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/votes/analytics_relatorio/${companyId}?${params.toString()}`);

      if (!response.data) {
        throw new Error('Nenhum dado retornado da API');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching analytics_relatorio:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Não autorizado. Por favor, faça login novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao buscar análises de relatório');
      }
      throw error;
    }
  },
  getByCompany: async (id_empresa: string): Promise<Vote[]> => {
    try {
      const response = await api.get(`/votes/empresa/${id_empresa}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company votes:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Não autorizado. Por favor, faça login novamente.');
        }
        throw new Error(error.response?.data?.message || 'Falha ao buscar votos da empresa');
      }
      throw error;
    }
  },
  getById: async (id: string) => {
    const response = await api.get(`/votes/${id}`);
    return response.data;
  },
  getByServiceType: async (id_tipo_servico: string) => {
    const response = await api.get(`/votes/servico/${id_tipo_servico}`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/votes/${id}`);
    return response.data;
  },
};

export default api;
