import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Search, RefreshCw, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputMask from 'react-input-mask';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { User, CreateUserRequest, UpdateUserRequest, UserFormData, UserFormDataUpdate } from '@/types/user';
import { users, companies } from '@/services/api';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsTree } from '@/components/PermissionsTree';
import { Permission } from '@/types/permission';

interface AccessProfile {
  value: string;
  label: string;
}

const userSchema = z.object({
  username: z.string().min(3, 'Username deve ter no mínimo 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  email: z.string().email('Email inválido'),
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().min(2, 'Cargo deve ter no mínimo 2 caracteres'),
  telcel: z.string().optional(),
  setor: z.string().optional(),
  image: z.string().optional(),
  perfil_acesso: z.string().min(1, 'Perfil de acesso é obrigatório'),
  empresas: z.array(z.string()).min(1, 'Selecione pelo menos uma empresa')
});

const updateUserSchema = userSchema.partial();

export default function Users() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const { data: usersList, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsersQuery } = useQuery({
    queryKey: ['users'],
    queryFn: users.getAll,
  });

  const { data: accessProfiles } = useQuery({
    queryKey: ['access-profiles'],
    queryFn: () => users.getAccessProfiles(),
  });

  const { data: companiesList, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateDialogOpen(false);
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar usuário',
        variant: 'destructive',
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => {
      console.log('Executando mutação de atualização:', { id, data });
      return users.update(id, data);
    },
    onSuccess: () => {
      console.log('Mutação executada com sucesso');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      console.error('Erro na mutação:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar usuário',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => users.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir usuário',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      nome: '',
      cargo: '',
      telcel: '',
      setor: '',
      image: '',
      perfil_acesso: '',
      empresas: [],
    },
  });

  const updateForm = useForm<UserFormDataUpdate>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: '',
      email: '',
      nome: '',
      cargo: '',
      telcel: '',
      setor: '',
      image: '',
      perfil_acesso: '',
      empresas: [],
    },
  });

  const onSubmit = async (data: UserFormData) => {
    try {
      console.log('Dados do usuário a serem criados:', data);
      console.log('Empresas selecionadas:', data.empresas);

      // Primeiro, cria o usuário com os dados básicos
      const userData = {
        username: data.username,
        password: data.password,
        email: data.email,
        nome: data.nome,
        cargo: data.cargo,
        telcel: data.telcel,
        setor: data.setor,
        image: data.image,
        perfil_acesso: data.perfil_acesso,
      };


      console.log('Dados formatados para o backend:', userData);

      // Cria o usuário
      const newUser = await users.create(userData);

      // Depois, vincula o usuário às empresas
      if (data.empresas && data.empresas.length > 0) {
        for (const companyId of data.empresas) {
          await users.linkToCompany(newUser.id, companyId);
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário criado com sucesso",
      });

      setIsCreateDialogOpen(false);
      form.reset();
      refetchUsers();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar usuário",
        variant: "destructive",
      });
    }
  };

  const onUpdate = async (data: UserFormDataUpdate) => {
    try {
      console.log('Dados do usuário a serem atualizados:', data);
      console.log('Empresas selecionadas:', data.empresas);

      // Primeiro, atualiza os dados básicos do usuário
      const userData = {
        username: data.username,
        email: data.email,
        nome: data.nome,
        cargo: data.cargo,
        telcel: data.telcel,
        setor: data.setor,
        image: data.image,
        perfil_acesso: data.perfil_acesso,

      };
      if (data.password && data.password.trim() !== '') {
        userData.password = data.password;
      }

      console.log('Dados formatados para o backend:', userData);

      if (!selectedUser) return;

      // Atualiza os dados do usuário
      await users.update(selectedUser.id, userData);

      // Depois, atualiza os vínculos com as empresas
      if (data.empresas && data.empresas.length > 0) {
        // Primeiro, remove todos os vínculos existentes
        const existingCompanies = selectedUser.empresas || [];
        for (const company of existingCompanies) {
          await users.unlinkFromCompany(selectedUser.id, company.id);
        }

        // Depois, cria os novos vínculos
        for (const companyId of data.empresas) {
          await users.linkToCompany(selectedUser.id, companyId);
        }
      }

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso",
      });

      setIsEditDialogOpen(false);
      updateForm.reset();
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (user: User) => {
    try {
      setLoadingPermissions(true);
      const permissions = await users.getPermissions(user.id);
      setUserPermissions(permissions);
      setSelectedUser(user);

      console.log('Usuário selecionado para edição:', user);
      console.log('Empresas do usuário:', user.empresas);

      // Inicializa o formulário com os dados do usuário
      const formData = {
        username: user.username,
        email: user.email,
        nome: user.nome,
        cargo: user.cargo,
        telcel: user.telcel || '',
        setor: user.setor || '',
        image: user.image || '',
        perfil_acesso: user.perfil_acesso,
        empresas: user.empresas.map(empresa => empresa.id)
      };

      console.log('Dados do formulário:', formData);
      updateForm.reset(formData);

      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões do usuário",
        variant: "destructive",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const filteredUsers = usersList?.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.nome.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.cargo?.toLowerCase().includes(searchLower)
    );
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast({
      title: "Atualizado",
      description: "Lista de usuários atualizada com sucesso",
    });
  };

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header no estilo Dashboard / Companies */}
          <div
            className={cn(
              'rounded-2xl sm:rounded-3xl p-4 sm:p-6',
              'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10 dark:to-transparent',
              'border border-primary/10 dark:border-primary/20'
            )}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-shrink-0 items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <UsersIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Usuários
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os usuários que têm acesso ao sistema.
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden xs:inline">Atualizar</span>
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, username, e-mail ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4"
            />
          </div>

          {/* Conteúdo */}
          {isLoadingUsers || isLoadingCompanies ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="h-40 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : usersError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <p className="font-medium text-destructive">Erro ao carregar usuários</p>
              <Button variant="outline" onClick={() => refetchUsersQuery()} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : usersList?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <UsersIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum usuário cadastrado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Adicione usuários para que possam acessar o sistema.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>
          ) : filteredUsers?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum resultado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Nenhum usuário encontrado para &quot;{searchTerm}&quot;. Tente outro termo.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers?.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.nome}</p>
                      <p className="truncate text-sm text-muted-foreground">{user.username}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditUser(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o usuário &quot;{user.nome}&quot;? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="truncate text-muted-foreground">{user.email}</p>
                    {user.cargo && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Cargo:</span> {user.cargo}
                      </p>
                    )}
                    {user.perfil_acesso && (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Perfil:</span> {user.perfil_acesso}
                      </p>
                    )}
                    <p className="truncate text-muted-foreground">
                      <span className="font-medium text-foreground">Empresas:</span>{' '}
                      {user.empresas?.length ? user.empresas.map((e) => e.nome).join(', ') : 'Nenhuma'}
                    </p>
                    {user.created_at && (
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-[700px] overflow-y-auto border-border bg-card p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Novo Usuário</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="acesso">Acesso ao Sistema</TabsTrigger>
              </TabsList>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <TabsContent value="dados-pessoais">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="telcel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone Celular</FormLabel>
                            <FormControl>
                              <InputMask
                                mask="(99) 99999-9999"
                                value={field.value || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                              >
                                {(inputProps: any) => <Input {...inputProps} />}
                              </InputMask>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={form.control}
                        name="setor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setor</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da Imagem</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="empresas"
                        render={({ field }) => {
                          const [search, setSearch] = useState('');
                          const allCompanyIds = companiesList?.map((c) => c.id) || [];
                          const filteredCompanies = companiesList?.filter(company =>
                            company.nome.toLowerCase().includes(search.toLowerCase())
                          ) || [];

                          const allSelected = field.value?.length === allCompanyIds.length;
                          const toggleAll = () => {
                            if (allSelected) {
                              field.onChange([]);
                            } else {
                              field.onChange(allCompanyIds);
                            }
                          };

                          return (
                            <FormItem className="col-span-full">
                              <FormLabel>Empresas</FormLabel>
                              <div className="mb-2 flex items-center gap-2">
                                <Input
                                  placeholder="Buscar empresa..."
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={toggleAll}
                                >
                                  {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {filteredCompanies.map((company) => (
                                  <label key={company.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      value={company.id}
                                      checked={field.value?.includes(company.id)}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...field.value, company.id]
                                          : field.value.filter((id) => id !== company.id);
                                        field.onChange(newValue);
                                      }}
                                    />
                                    <span>{company.nome}</span>
                                  </label>
                                ))}
                              </div>
                              <FormDescription>
                                Use o campo de busca para filtrar e o botão para selecionar tudo.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="acesso">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="perfil_acesso"
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Perfil de Acesso</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Selecione um perfil</option>
                                {accessProfiles?.map((profile) => (
                                  <option key={profile.value} value={profile.value}>
                                    {profile.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full md:w-auto">
                      Criar Usuário
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-[700px] overflow-y-auto border-border bg-card p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="acesso">Acesso ao Sistema</TabsTrigger>
                <TabsTrigger value="permissoes">Permissões</TabsTrigger>
              </TabsList>
              <Form {...updateForm}>
                <form onSubmit={(e) => {
                  console.log('Formulário submetido');
                  updateForm.handleSubmit(onUpdate)(e);
                }} className="space-y-4 mt-4">
                  <TabsContent value="dados-pessoais">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={updateForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="telcel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone Celular</FormLabel>
                            <FormControl>
                              <InputMask
                                mask="(99) 99999-9999"
                                value={field.value || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                              >
                                {(inputProps: any) => <Input {...inputProps} />}
                              </InputMask>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* <FormField
                        control={updateForm.control}
                        name="setor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setor</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                      <FormField
                        control={updateForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL da Imagem</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="empresas"
                        render={({ field }) => {
                          const [search, setSearch] = useState('');
                          const allCompanyIds = companiesList?.map((c) => c.id) || [];
                          const filteredCompanies = companiesList?.filter(company =>
                            company.nome.toLowerCase().includes(search.toLowerCase())
                          ) || [];

                          const allSelected = field.value?.length === allCompanyIds.length;
                          const toggleAll = () => {
                            if (allSelected) {
                              field.onChange([]);
                            } else {
                              field.onChange(allCompanyIds);
                            }
                          };

                          return (
                            <FormItem className="col-span-full">
                              <FormLabel>Empresas</FormLabel>
                              <div className="mb-2 flex items-center gap-2">
                                <Input
                                  placeholder="Buscar empresa..."
                                  value={search}
                                  onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={toggleAll}
                                >
                                  {allSelected ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {filteredCompanies.map((company) => (
                                  <label key={company.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      value={company.id}
                                      checked={field.value?.includes(company.id)}
                                      onChange={(e) => {
                                        const newValue = e.target.checked
                                          ? [...field.value, company.id]
                                          : field.value.filter((id) => id !== company.id);
                                        field.onChange(newValue);
                                      }}
                                    />
                                    <span>{company.nome}</span>
                                  </label>
                                ))}
                              </div>
                              <FormDescription>
                                Use o campo de busca para filtrar e o botão para selecionar tudo.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                    </div>
                  </TabsContent>
                  <TabsContent value="acesso">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={updateForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha (deixe em branco para manter a atual)</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={updateForm.control}
                        name="perfil_acesso"
                        render={({ field }) => (
                          <FormItem className="col-span-full">
                            <FormLabel>Perfil de Acesso</FormLabel>
                            <FormControl>
                              <select
                                {...field}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <option value="">Selecione um perfil</option>
                                {accessProfiles?.map((profile) => (
                                  <option key={profile.value} value={profile.value}>
                                    {profile.label}
                                  </option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full md:w-auto">
                      Atualizar Usuário
                    </Button>
                  </div>
                </form>
              </Form>
              <TabsContent value="permissoes" className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Permissões do Usuário</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie as permissões do usuário selecionando as opções abaixo.
                  </p>
                </div>
                {selectedUser && (
                  <PermissionsTree
                    permissions={userPermissions}
                    isLoading={loadingPermissions}
                    onPermissionChange={async (permission, has_permission) => {
                      try {
                        await users.updatePermission(selectedUser.id, permission, has_permission);
                        // Recarrega as permissões do usuário
                        const updatedPermissions = await users.getPermissions(selectedUser.id);
                        setUserPermissions(updatedPermissions);
                        toast({
                          title: "Sucesso",
                          description: "Permissão atualizada com sucesso",
                        });
                      } catch (error) {
                        console.error('Erro ao atualizar permissão:', error);
                        toast({
                          title: "Erro",
                          description: "Erro ao atualizar permissão",
                          variant: "destructive",
                        });
                      }
                    }}
                  />
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </div>
  );
} 