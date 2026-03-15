import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Activity } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={cn(
        'fixed top-0 z-50 h-14 w-full border-b border-border bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'transition-[left,width] duration-200 ease-out',
        'left-0 md:left-[var(--sidebar-width)]'
      )}
      style={{ '--sidebar-width': '16rem' } as React.CSSProperties}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        {/* Esquerda: trigger (mobile) + logo */}
        <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
          <SidebarTrigger
            className="md:hidden h-9 w-9 shrink-0 rounded-lg border border-border bg-background hover:bg-accent"
            aria-label="Abrir menu"
          />
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex shrink-0 items-center gap-2 rounded-md outline-none ring-ring focus-visible:ring-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <span className="hidden font-semibold text-foreground sm:inline-block truncate text-lg">
              Satisfaction
            </span>
          </Link>
        </div>

        {/* Direita: tema, usuário, ações */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {isAuthenticated ? (
            <>
              <ThemeToggle />
              <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground sm:max-w-[180px] md:inline">
                {user?.nome ?? user?.username ?? 'Usuário'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link to="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'font-medium',
                    isActive('/login') && 'text-primary bg-primary/10'
                  )}
                >
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="font-medium">
                  Registrar
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
