import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { votes } from '@/services/api';
import {
  Home,
  BarChart3,
  Building,
  LayoutList,
  LogOut,
  Activity,
  Monitor,
  ThumbsUp,
  Users,
  FileText
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const { isAuthenticated, logout, user, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Fetch operation status for sidebar metrics
  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const { data: operationStatus } = useQuery({
    queryKey: ['operation-status-sidebar', startDate, endDate],
    queryFn: () => votes.getOperationStatus(startDate, endDate),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch company ranking for sidebar
  const { data: companyRanking } = useQuery({
    queryKey: ['company-ranking-sidebar', startDate, endDate],
    queryFn: () => votes.getCompanyRanking(startDate, endDate, undefined, 5),
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = isAuthenticated
    ? [
      {
        title: 'Dashboard',
        icon: Home,
        path: '/dashboard',
        permission: 'dashboard'
      },
      {
        title: 'Monitor',
        icon: Monitor,
        path: '/monitor',
        permission: 'gestao'
      },
      {
        title: 'Empresas',
        icon: Building,
        path: '/companies',
        permission: 'cadastros_companies'
      },
      {
        title: 'Tipos de Serviço',
        icon: LayoutList,
        path: '/service-types',
        permission: 'cadastros_service_types'
      },
      {
        title: 'Votos',
        icon: ThumbsUp,
        path: '/votes',
        permission: 'pesquisas_votes'
      },
      {
        title: 'Usuários',
        icon: Users,
        path: '/users',
        permission: 'autorizacoes_users'
      },
      {
        title: 'Relatórios',
        icon: FileText,
        path: '/relatorios',
        permission: 'relatorios'
      },
      {
        title: 'Status da Operação',
        icon: BarChart3,
        path: '/status-operacao',
        permission: 'relatorios'
      },
    ].filter(item => hasPermission(item.permission))
    : [
      {
        title: 'Home',
        path: '/',
        icon: Home,
      },
      {
        title: 'Login',
        path: '/login',
        icon: LogOut,
      },
      {
        title: 'Registrar',
        path: '/register',
        icon: LogOut,
      },
    ];

  return (
    <SidebarComponent className="bg-white dark:bg-neutral-950 border-r border-border" breakpoint="md" defaultCollapsed>


      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-2 px-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">Satisfaction</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 w-full hover:bg-accent rounded-md ${isActive(item.path) ? 'bg-accent' : ''}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {isAuthenticated && (
          <div className="space-y-4">

            {/* RANKING TOP 5 */}
            {companyRanking?.ranking && companyRanking.ranking.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-bold text-center">🏆 Top 5 Empresas</div>
                <div className="space-y-1">
                  {companyRanking.ranking.slice(0, 5).map((company) => (
                    <div key={company.companyId} className="flex items-center justify-between px-2 py-1 bg-accent/50 rounded text-xs">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-bold text-primary">{company.position}º</span>
                        <span className="truncate" title={company.companyName}>{company.companyName}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">
                          {company.satisfacao.percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STATUS DA OPERAÇÃO PRIMEIRO */}
            <div className="space-y-2">
              <div className="text-sm font-bold text-center">Status da Operação</div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>😁</span>
                  <span>Satisfação</span>
                </div>
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {operationStatus?.metrics.satisfacao.percentage.toFixed(1) || '0.0'}%
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span>😕</span>
                  <span>Melhoria</span>
                </div>
                <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {operationStatus?.metrics.melhoria.percentage.toFixed(1) || '0.0'}%
                </div>
              </div>
            </div>

            {/* NOME DO USUÁRIO */}
            <div className="px-2 py-2 border rounded-md">
              <div className="text-sm font-medium">{user?.nome}</div>
              <div className="text-xs text-muted-foreground">{user?.perfil}</div>
            </div>

            {/* BOTÃO SAIR */}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </Button>

          </div>
        )}
      </SidebarFooter>
    </SidebarComponent>
  );
};

export default Sidebar;
