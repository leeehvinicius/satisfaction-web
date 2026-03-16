import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Lock, LogIn, Eye, EyeOff, Sparkles } from 'lucide-react';


const formSchema = z.object({
  username: z.string().min(1, 'Usuário é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: { username: string; password: string }) => {
    try {
      await login(data.username, data.password);
    } catch (error) {
      setError('root', {
        message: 'Usuário ou senha inválidos',
      });
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-black px-4 py-8">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="w-full max-w-5xl">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-center">
          {/* Coluna de branding / destaque (some em telas muito pequenas) */}
          <div className="hidden md:flex flex-col justify-center space-y-6 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-800 px-8 py-10 relative overflow-hidden">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-400/40 via-purple-400/30 to-pink-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-gradient-to-tr from-indigo-500/20 via-sky-400/10 to-transparent blur-3xl" />

            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/80 dark:bg-indigo-500/15 border border-indigo-100 dark:border-indigo-500/30 px-4 py-1.5 w-fit text-xs font-medium text-indigo-700 dark:text-indigo-200">
              <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
              Plataforma de satisfação em tempo real
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                Satisfação do cliente,
                <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-400 bg-clip-text text-transparent">
                  em um só lugar.
                </span>
              </h1>
              <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 max-w-md">
                Acompanhe indicadores em tempo real, visualize relatórios claros e
                tome decisões rápidas para encantar seus clientes.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold">
                    4.8
                  </span>
                  <span className="font-semibold">NPS médio</span>
                </div>
                <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  Clientes mais satisfeitos e engajados ao longo do tempo.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-200/60 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-sm font-semibold">
                    24h
                  </span>
                  <span className="font-semibold">Feedback em tempo real</span>
                </div>
                <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400">
                  Monitore operações críticas com dashboards atualizados.
                </p>
              </div>
            </div>
          </div>

          {/* Coluna do formulário de login */}
          <div className="w-full">
            <div className="bg-white/90 dark:bg-gray-900/95 text-gray-900 dark:text-gray-100 rounded-2xl shadow-2xl border border-gray-100/80 dark:border-gray-800 px-6 py-8 sm:px-8 sm:py-10">
              <div className="mb-8 flex flex-col gap-3">
                <div className="inline-flex items-center gap-2 self-start rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Acesso seguro ao painel
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">
                    Bem-vindo de volta
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Entre com suas credenciais para acessar o painel de satisfação.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium mb-1.5">
                      Nome de usuário
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <User className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <input
                        {...register('username')}
                        id="username"
                        type="text"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300/80 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-sm"
                        placeholder="Digite seu nome de usuário"
                        autoComplete="username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                      Senha
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <Lock className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <input
                        {...register('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-300/80 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 text-sm"
                        placeholder="Digite sua senha"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {errors.root && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-lg px-3 py-2">
                    {errors.root.message}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block">
                      Manter conectado
                    </label>
                  </div>

                  <button
                    type="button"
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 self-start sm:self-auto"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-3.5 px-4 transition duration-200 transform hover:translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" aria-hidden="true" />
                      Entrar
                    </>
                  )}
                </button>
              </form>

              {/* <div className="mt-6 text-center text-xs sm:text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition duration-200"
                  >
                    Crie uma agora
                  </button>
                </p>
              </div> */}
            </div>
          </div>
        </div>
        </div>
      </div>
      <footer className="flex justify-center pb-5 pt-2 shrink-0">
        <img
          src={theme === 'dark' ? '/logo_dark.png' : '/logo_white.png'}
          alt="Logo"
          className="h-12 w-auto object-contain opacity-90"
        />
      </footer>
    </div>
  );
};

export default Login;
