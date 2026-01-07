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
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { useNavigate } from 'react-router-dom';
// import authService from '../services/auth';
// import { RegisterRequest } from '../types/api';

// const formSchema = z.object({
//   username: z.string().min(3, 'O nome de usuário deve ter pelo menos 3 caracteres'),
//   password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
//   email: z.string().email('Email inválido'),
//   nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
//   cargo: z.string().min(2, 'O cargo deve ter pelo menos 2 caracteres'),
//   perfil_acesso: z.string().min(1, 'O perfil de acesso é obrigatório'),
//   telcel: z.string().min(10, 'O número de telefone deve ter pelo menos 10 dígitos'),
// });

// type FormData = z.infer<typeof formSchema>;

// const Register: React.FC = () => {
//   const navigate = useNavigate();
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm<FormData>({
//     resolver: zodResolver(formSchema),
//   });

//   const onSubmit = async (data: FormData) => {
//     try {
//       const registerData: RegisterRequest = {
//         username: data.username,
//         password: data.password,
//         email: data.email,
//         nome: data.nome,
//         cargo: data.cargo,
//         perfil_acesso: data.perfil_acesso,
//         telcel: data.telcel,
//       };

//       await authService.register(registerData);
//       alert('Cadastro realizado com sucesso! Por favor, faça login.');
//       navigate('/login');
//     } catch (error) {
//       alert(error instanceof Error ? error.message : 'Falha no cadastro');
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100">
//       <div className="max-w-md w-full mx-4">
//         <div className="bg-white rounded-2xl shadow-xl p-8">
//           <div className="text-center mb-8">
//             <h2 className="text-3xl font-bold text-gray-900 mb-2">Criar Conta</h2>
//             <p className="text-gray-600">Junte-se a nós e comece sua jornada</p>
//           </div>

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//             <div className="space-y-4">
//               <div>
//                 <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
//                   Nome de Usuário
//                 </label>
//                 <input
//                   {...register('username')}
//                   type="text"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite seu nome de usuário"
//                 />
//                 {errors.username && (
//                   <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
//                   Senha
//                 </label>
//                 <input
//                   {...register('password')}
//                   type="password"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite sua senha"
//                 />
//                 {errors.password && (
//                   <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
//                   Email
//                 </label>
//                 <input
//                   {...register('email')}
//                   type="email"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite seu email"
//                 />
//                 {errors.email && (
//                   <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
//                   Nome Completo
//                 </label>
//                 <input
//                   {...register('nome')}
//                   type="text"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite seu nome completo"
//                 />
//                 {errors.nome && (
//                   <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-1">
//                   Cargo
//                 </label>
//                 <input
//                   {...register('cargo')}
//                   type="text"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite seu cargo"
//                 />
//                 {errors.cargo && (
//                   <p className="mt-1 text-sm text-red-600">{errors.cargo.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="perfil_acesso" className="block text-sm font-medium text-gray-700 mb-1">
//                   Perfil de Acesso
//                 </label>
//                 <select
//                   {...register('perfil_acesso')}
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                 >
//                   <option value="">Selecione um perfil</option>
//                   <option value="T.I">T.I</option>
//                   <option value="Usuário Cliente">Usuário Cliente</option>
//                   <option value="Gerente">Gerente</option>
//                   <option value="Cliente">Cliente</option>
//                   <option value="Diretor(a)">Diretor(a)</option>
//                   <option value="Administrador(a)">Administrador(a)</option>
//                 </select>
//                 {errors.perfil_acesso && (
//                   <p className="mt-1 text-sm text-red-600">{errors.perfil_acesso.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label htmlFor="telcel" className="block text-sm font-medium text-gray-700 mb-1">
//                   Telefone
//                 </label>
//                 <input
//                   {...register('telcel')}
//                   type="tel"
//                   className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
//                   placeholder="Digite seu número de telefone"
//                 />
//                 {errors.telcel && (
//                   <p className="mt-1 text-sm text-red-600">{errors.telcel.message}</p>
//                 )}
//               </div>
//             </div>

//             <button
//               type="submit"
//               className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//             >
//               Criar Conta
//             </button>
//           </form>

//           <div className="mt-6 text-center">
//             <p className="text-sm text-gray-600">
//               Já tem uma conta?{' '}
//               <button
//                 onClick={() => navigate('/login')}
//                 className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-200"
//               >
//                 Faça login
//               </button>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;
