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
  FileText,
  X,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const { isAuthenticated, logout, user, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const now = new Date();
  const startDate = now.toISOString().split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const { data: operationStatus } = useQuery({
    queryKey: ['operation-status-sidebar', startDate, endDate],
    queryFn: () => votes.getOperationStatus(startDate, endDate),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const { data: companyRanking } = useQuery({
    queryKey: ['company-ranking-sidebar', startDate, endDate],
    queryFn: () => votes.getCompanyRanking(startDate, endDate, undefined, 5),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (isMobile) setOpenMobile(false);
  };

  const handleNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  const menuItems = isAuthenticated
    ? [
        { title: 'Dashboard', icon: Home, path: '/dashboard', permission: 'dashboard' },
        { title: 'Monitor', icon: Monitor, path: '/monitor', permission: 'gestao' },
        { title: 'Empresas', icon: Building, path: '/companies', permission: 'cadastros_companies' },
        { title: 'Tipos de Serviço', icon: LayoutList, path: '/service-types', permission: 'cadastros_service_types' },
        { title: 'Votos', icon: ThumbsUp, path: '/votes', permission: 'pesquisas_votes' },
        { title: 'Usuários', icon: Users, path: '/users', permission: 'autorizacoes_users' },
        { title: 'Relatórios', icon: FileText, path: '/relatorios', permission: 'relatorios' },
        { title: 'Status da Operação', icon: BarChart3, path: '/status-operacao', permission: 'relatorios' },
      ].filter((item) => hasPermission(item.permission))
    : [
        { title: 'Home', path: '/', icon: Home },
        { title: 'Login', path: '/login', icon: LogOut },
        { title: 'Registrar', path: '/register', icon: LogOut },
      ];

  return (
    <SidebarComponent
      side="left"
      variant="sidebar"
      collapsible="offcanvas"
      className={cn(
        'border-r border-border',
        'bg-sidebar text-sidebar-foreground',
        'dark:bg-neutral-950 dark:border-neutral-800'
      )}
    >
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-border px-4 py-3">
        <Link
          to="/"
          onClick={handleNav}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md outline-none ring-sidebar-ring focus-visible:ring-2"
        >
          <Activity className="h-6 w-6 shrink-0 text-primary" />
          <span className="truncate text-lg font-semibold text-foreground">Satisfaction</span>
        </Link>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setOpenMobile(false)}
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        {!isMobile && (
          <div className="shrink-0">
            <ThemeToggle />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="flex-1 px-2">
          <SidebarGroup className="py-3">
            <SidebarGroupLabel className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent className="mt-1">
              <SidebarMenu className="flex flex-col gap-0.5">
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.title}>
                      <Link to={item.path} onClick={handleNav}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {isAuthenticated && (
        <SidebarFooter className="border-t border-border">
          <ScrollArea className="max-h-[min(50vh,320px)]">
            <div className="space-y-4 p-4">
              {isMobile && (
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              )}

              {companyRanking?.ranking && companyRanking.ranking.length > 0 && (
                <div className="space-y-2">
                  <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    🏆 Top 5
                  </p>
                  <div className="space-y-1.5">
                    {companyRanking.ranking.slice(0, 5).map((company) => (
                      <div
                        key={company.companyId}
                        className="flex items-center justify-between gap-2 rounded-lg bg-accent/50 px-2.5 py-1.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span className="shrink-0 text-xs font-bold text-primary">
                            {company.position}º
                          </span>
                          <span className="truncate text-xs" title={company.companyName}>
                            {company.companyName}
                          </span>
                        </div>
                        <span className="shrink-0 rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white">
                          {company.satisfacao.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </p>
                <div className="flex flex-col gap-1.5 rounded-lg bg-muted/50 p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <span aria-hidden>😁</span>
                      Satisfação
                    </span>
                    <span className="rounded bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                      {operationStatus?.metrics.satisfacao.percentage.toFixed(1) ?? '0.0'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <span aria-hidden>😕</span>
                      Melhoria
                    </span>
                    <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {operationStatus?.metrics.melhoria.percentage.toFixed(1) ?? '0.0'}%
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border border-border bg-card px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{user?.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.perfil}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </ScrollArea>
        </SidebarFooter>
      )}
    </SidebarComponent>
  );
};

export default Sidebar;
