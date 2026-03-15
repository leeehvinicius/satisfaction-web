import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceTypes } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Search, RefreshCw, LayoutList } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ServiceType, CreateServiceTypeRequest, UpdateServiceTypeRequest } from '@/types/serviceType';
import { cn } from '@/lib/utils';

const ServiceTypes: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddServiceTypeOpen, setIsAddServiceTypeOpen] = useState(false);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CreateServiceTypeRequest>({
    nome: '',
    user_add: 'admin',
    user_edt: 'admin',
  } as CreateServiceTypeRequest);

  const {
    data: serviceTypesData,
    isLoading: isLoadingServiceTypes,
    error: serviceTypesError,
    refetch: refetchServiceTypes,
  } = useQuery({
    queryKey: ['service-types'],
    queryFn: serviceTypes.getAll,
  });

  const createMutation = useMutation({
    mutationFn: serviceTypes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setIsAddServiceTypeOpen(false);
      setFormData({ nome: '', user_add: 'admin', user_edt: 'admin' } as CreateServiceTypeRequest);
      toast({ title: 'Tipo de serviço adicionado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceTypeRequest }) =>
      serviceTypes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      setIsAddServiceTypeOpen(false);
      setSelectedServiceType(null);
      toast({ title: 'Tipo de serviço atualizado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: serviceTypes.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-types'] });
      toast({ title: 'Tipo de serviço excluído com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (serviceType: ServiceType) => {
    setSelectedServiceType(serviceType);
    setFormData({
      nome: serviceType.nome,
      user_add: serviceType.user_add || 'admin',
      user_edt: 'admin',
    } as CreateServiceTypeRequest);
    setIsAddServiceTypeOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleRefresh = () => {
    refetchServiceTypes();
    toast({ title: 'Atualizado', description: 'Lista atualizada com sucesso' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceType) {
      updateMutation.mutate({ id: selectedServiceType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredServiceTypes = serviceTypesData?.filter((serviceType: ServiceType) =>
    serviceType.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <LayoutList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Tipos de Serviço
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os tipos de serviço disponíveis.
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden xs:inline">Atualizar</span>
                </Button>
                <Button
                  onClick={() => {
                    setSelectedServiceType(null);
                    setFormData({ nome: '', user_add: 'admin', user_edt: 'admin' } as CreateServiceTypeRequest);
                    setIsAddServiceTypeOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Tipo de Serviço
                </Button>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar tipos de serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4"
            />
          </div>

          {/* Conteúdo */}
          {isLoadingServiceTypes ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : serviceTypesError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <p className="font-medium text-destructive">Erro ao carregar tipos de serviço</p>
              <Button variant="outline" onClick={() => refetchServiceTypes()} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : serviceTypesData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <LayoutList className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum tipo de serviço cadastrado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Adicione tipos de serviço para organizar os serviços das empresas.
              </p>
              <Button
                onClick={() => {
                  setSelectedServiceType(null);
                  setFormData({ nome: '', user_add: 'admin', user_edt: 'admin' } as CreateServiceTypeRequest);
                  setIsAddServiceTypeOpen(true);
                }}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Tipo de Serviço
              </Button>
            </div>
          ) : filteredServiceTypes?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum resultado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Nenhum tipo de serviço encontrado para &quot;{searchTerm}&quot;. Tente outro termo.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {filteredServiceTypes?.map((serviceType: ServiceType) => (
                <div
                  key={serviceType.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{serviceType.nome}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(serviceType)}
                      className="h-8 w-8"
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
                          <AlertDialogTitle>Excluir tipo de serviço</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o tipo de serviço &quot;{serviceType.nome}&quot;? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(serviceType.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo / Editar */}
      <Dialog open={isAddServiceTypeOpen} onOpenChange={setIsAddServiceTypeOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg border-border bg-card p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold sm:text-xl">
              {selectedServiceType ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
            </DialogTitle>
            <DialogDescription>
              {selectedServiceType
                ? 'Edite as informações do tipo de serviço.'
                : 'Adicione um novo tipo de serviço.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome"
                className="h-10"
              />
            </div>
            <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddServiceTypeOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? selectedServiceType
                    ? 'Salvando...'
                    : 'Adicionando...'
                  : selectedServiceType
                    ? 'Salvar'
                    : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceTypes;
