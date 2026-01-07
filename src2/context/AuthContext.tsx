import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/services/api';
import { toast } from 'sonner';

interface Permission {
  id: string;
  permission: string;
  has_permission: boolean;
  user_id: string;
}

interface User {
  id: string;
  username: string;
  nome: string;
  perfil: string;
  permissions?: Permission[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: { 
    username: string; 
    password: string; 
    email: string; 
    nome: string;
    cargo: string;
    perfil_acesso: string;
  }) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Fetch user permissions
          const permissions = await auth.getUserPermissions(parsedUser.id);
          setUser(prev => prev ? { ...prev, permissions } : null);
        } catch (error) {
          console.error('Error initializing auth:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await auth.login(username, password);
      const { access_token, user } = response;
      
      // Store auth data
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update state
      setToken(access_token);
      setUser(user);
      setIsAuthenticated(true);
      
      // Get user permissions after setting the token
      const permissions = await auth.getUserPermissions(user.id);
      setUser(prev => prev ? { ...prev, permissions } : null);
      
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Falha no login. Verifique suas credenciais.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { 
    username: string; 
    password: string; 
    email: string; 
    nome: string;
    cargo: string;
    perfil_acesso: string;
  }) => {
    try {
      setIsLoading(true);
      await auth.register(userData);
      toast.success('Registro realizado com sucesso! Por favor, faça login.');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Falha no registro. Verifique os dados e tente novamente.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    
    toast.info('Você foi desconectado.');
    navigate('/login', { replace: true });
  };

  const hasPermission = (permission: string): boolean => {
    if (!user?.permissions) return false;
    const userPermission = user.permissions.find(p => p.permission === permission);
    return userPermission?.has_permission || false;
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
