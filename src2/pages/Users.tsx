import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, Search, RefreshCw, Users as UsersIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InputMask from 'react-input-mask';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { User, CreateUserRequest, UpdateUserRequest, UserFormData, UserFormDataUpdate } from '@/types/user';
import { users, companies } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionsTree } from '@/components/PermissionsTree';
import { toast } from 'sonner';
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

  const { data: usersList, isLoading: isLoadingUsers } = useQuery({
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

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUserMutation.mutate(id);
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

  if (isLoadingUsers || isLoadingCompanies) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 gap-6">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className="h-[60px] rounded-lg bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Usuários</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie os usuários que têm acesso ao sistema.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Usuário</span>
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {usersList?.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg border-border bg-secondary/20 flex flex-col items-center justify-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum usuário cadastrado</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Adicione usuários para que possam acessar o sistema.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Username</TableHead>
                    <TableHead className="w-[200px]">Nome</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[150px]">Cargo</TableHead>
                    <TableHead className="w-[150px]">Perfil</TableHead>
                    <TableHead className="w-[200px]">Empresas</TableHead>
                    <TableHead className="w-[150px]">Criado em</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.cargo}</TableCell>
                      <TableCell>{user.perfil_acesso}</TableCell>
                      <TableCell>
                        {user.empresas?.length > 0
                          ? user.empresas.map((empresa) => empresa.nome).join(', ')
                          : 'Nenhuma empresa'}
                      </TableCell>
                      <TableCell>
                        {user.created_at ? (
                          format(parseISO(user.created_at), 'dd/MM/yyyy HH:mm', {
                            locale: ptBR,
                          })
                        ) : (
                          'Data não disponível'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
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
          <DialogContent className="sm:max-w-[700px]">
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
  );
} 