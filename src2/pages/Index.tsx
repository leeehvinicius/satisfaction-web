import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return null; // ou um loader se quiser
};

export default Index;
// import React from 'react';
// import { Link } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import { useAuth } from '@/context/AuthContext';
// import { ArrowRight, BarChart3, Check, Activity } from 'lucide-react';
// import ThemeToggle from '@/components/ThemeToggle';

// const Index = () => {
//   const { isAuthenticated } = useAuth();

//   return (
//     <div className="min-h-screen bg-background flex flex-col">
//       <header className="border-b py-6 px-4 sm:px-6 lg:px-8">
//         <div className="container mx-auto flex justify-between items-center">
//           <div className="flex items-center gap-2">
//             <Activity className="h-6 w-6 text-primary" />
//             <span className="text-xl font-semibold">Satisfaction</span>
//           </div>
          
//           <div className="flex items-center gap-4">
//             <ThemeToggle />
//             {isAuthenticated ? (
//               <Link to="/dashboard">
//                 <Button variant="default">
//                   Acessar Dashboard
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Button>
//               </Link>
//             ) : (
//               <>
//                 <Link to="/login" className="text-foreground hover:text-primary transition-colors">
//                   Login
//                 </Link>
//                 <Link to="/register">
//                   <Button variant="default">Registrar</Button>
//                 </Link>
//               </>
//             )}
//           </div>
//         </div>
//       </header>
      
//       <main className="flex-1">
//         <section className="py-20 px-4">
//           <div className="container mx-auto max-w-5xl animate-fade-in">
//             <div className="text-center mb-12">
//               <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
//                 Sistema de <span className="text-primary">Feedback</span> Interativo
//               </h1>
//               <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
//                 Acompanhe a satisfação de clientes em tempo real, visualize estatísticas e gerencie feedback de empresas em uma interface elegante e intuitiva.
//               </p>
              
//               <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
//                 {isAuthenticated ? (
//                   <Link to="/dashboard">
//                     <Button size="lg" className="px-8 group">
//                       <span>Ir para Dashboard</span>
//                       <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
//                     </Button>
//                   </Link>
//                 ) : (
//                   <>
//                     <Link to="/register">
//                       <Button size="lg" className="px-8 group">
//                         <span>Começar Agora</span>
//                         <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
//                       </Button>
//                     </Link>
//                     <Link to="/login">
//                       <Button size="lg" variant="outline" className="px-8">
//                         Fazer Login
//                       </Button>
//                     </Link>
//                   </>
//                 )}
//               </div>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
//               <div className="glass-card p-6 rounded-lg hover:shadow-md transition-shadow border border-border/40">
//                 <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                   <BarChart3 className="text-primary h-6 w-6" />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Feedback em Tempo Real</h3>
//                 <p className="text-muted-foreground">
//                   Visualize os resultados das avaliações instantaneamente à medida que novos feedbacks são registrados.
//                 </p>
//               </div>
              
//               <div className="glass-card p-6 rounded-lg hover:shadow-md transition-shadow border border-border/40">
//                 <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                   <Activity className="text-primary h-6 w-6" />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Análise Detalhada</h3>
//                 <p className="text-muted-foreground">
//                   Acesse gráficos interativos e relatórios detalhados para entender melhor a satisfação dos clientes.
//                 </p>
//               </div>
              
//               <div className="glass-card p-6 rounded-lg hover:shadow-md transition-shadow border border-border/40">
//                 <div className="bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                   <Check className="text-primary h-6 w-6" />
//                 </div>
//                 <h3 className="text-xl font-semibold mb-2">Gerenciamento Completo</h3>
//                 <p className="text-muted-foreground">
//                   Cadastre empresas, tipos de serviços e gerencie todo o sistema de avaliação em um só lugar.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>
        
//         <section className="py-16 bg-secondary/70">
//           <div className="container mx-auto px-4 max-w-5xl">
//             <div className="text-center mb-12">
//               <h2 className="text-3xl font-bold mb-4">Como Funciona</h2>
//               <p className="text-muted-foreground max-w-2xl mx-auto">
//                 Nosso sistema de avaliação interativo é simples de usar e oferece resultados imediatos.
//               </p>
//             </div>
            
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               <div className="bg-background/80 p-6 rounded-lg backdrop-blur-sm">
//                 <div className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-primary text-primary-foreground font-bold mb-4">
//                   1
//                 </div>
//                 <h3 className="text-lg font-semibold mb-2">Registro</h3>
//                 <p className="text-muted-foreground">
//                   Registre-se no sistema e comece a explorar as funcionalidades disponíveis.
//                 </p>
//               </div>
              
//               <div className="bg-background/80 p-6 rounded-lg backdrop-blur-sm">
//                 <div className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-primary text-primary-foreground font-bold mb-4">
//                   2
//                 </div>
//                 <h3 className="text-lg font-semibold mb-2">Cadastro</h3>
//                 <p className="text-muted-foreground">
//                   Adicione empresas e tipos de serviços que serão avaliados pelos clientes.
//                 </p>
//               </div>
              
//               <div className="bg-background/80 p-6 rounded-lg backdrop-blur-sm">
//                 <div className="inline-flex items-center justify-center rounded-full w-10 h-10 bg-primary text-primary-foreground font-bold mb-4">
//                   3
//                 </div>
//                 <h3 className="text-lg font-semibold mb-2">Visualização</h3>
//                 <p className="text-muted-foreground">
//                   Acompanhe os feedbacks em tempo real e obtenha insights valiosos sobre a satisfação dos clientes.
//                 </p>
//               </div>
//             </div>
            
//             <div className="mt-12 text-center">
//               <Link to={isAuthenticated ? "/dashboard" : "/register"}>
//                 <Button size="lg" className="px-8">
//                   {isAuthenticated ? "Acessar Dashboard" : "Começar Agora"}
//                 </Button>
//               </Link>
//             </div>
//           </div>
//         </section>
//       </main>
      
//       <footer className="border-t py-8 px-4">
//         <div className="container mx-auto text-center">
//           <p className="text-muted-foreground text-sm">
//             © {new Date().getFullYear()} Satisfaction. Todos os direitos reservados.
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default Index;
