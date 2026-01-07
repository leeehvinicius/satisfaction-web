
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Activity, BarChart3, Building, LayoutList,Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';


const Navbar: React.FC = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-md z-50 border-b border-border transition-all duration-300">

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
          <SidebarTrigger className="mr-2 p-2 rounded-md hover:bg-accent transition">
            <Menu className="h-5 w-5" />
          </SidebarTrigger>

            <Link 
              to="/" 
              className="flex items-center gap-2 transition-transform hover:scale-105 duration-300"
            >
              <Activity className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">Satisfaction</span>
            </Link>
          

          </div>
          
          <div className="hidden md:flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {/* <Link 
                  to="/dashboard" 
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard') 
                      ? 'text-primary' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  Dashboard
                  {isActive('/dashboard') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transform animate-pulse" />
                  )}
                </Link> */}
                {/* <Link 
                  to="/companies" 
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/companies') 
                      ? 'text-primary' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  Empresas
                  {isActive('/companies') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transform animate-pulse" />
                  )}
                </Link> */}
                {/* <Link 
                  to="/service-types" 
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/service-types') 
                      ? 'text-primary' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  Serviços
                  {isActive('/service-types') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transform animate-pulse" />
                  )}
                </Link> */}
                <div className="ml-4 flex items-center gap-2">
                  <ThemeToggle />
                  <span className="text-sm font-medium text-foreground/80">
                    {user?.name}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={logout}
                    className="text-foreground/70 hover:text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <ThemeToggle />
                <Link 
                  to="/login" 
                  className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login') 
                      ? 'text-primary' 
                      : 'text-foreground/80 hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  Login
                  {isActive('/login') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full transform animate-pulse" />
                  )}
                </Link>
                <Link 
                  to="/register" 
                  className={`ml-3 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors`}
                >
                  Registrar
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link to="/dashboard">
                  <BarChart3 className="h-6 w-6 text-foreground/80 hover:text-primary transition-colors" />
                </Link>
                <Link to="/companies">
                  <Building className="h-6 w-6 text-foreground/80 hover:text-primary transition-colors" />
                </Link>
                <Link to="/service-types">
                  <LayoutList className="h-6 w-6 text-foreground/80 hover:text-primary transition-colors" />
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout}
                  className="text-foreground/70 hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link 
                  to="/login" 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
