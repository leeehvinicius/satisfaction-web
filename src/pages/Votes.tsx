import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { votes, companies } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Company } from '@/types/company';
import { Service } from '@/types/service';
import { Vote } from '@/types/vote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  RefreshCw, 
  Trash2,
  ThumbsUp,
  Building2,
  LayoutList,
  Star,
  ThumbsDown,
  Heart,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Votes: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Queries
  const { data: companiesList } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const { data: votesList, isLoading: isLoadingVotes, error: votesError, refetch } = useQuery({
    queryKey: ['votes'],
    queryFn: votes.getAll,
    enabled: true,
  });

  // Query para buscar serviços da empresa selecionada
  const { data: companyServices } = useQuery<Service[]>({
    queryKey: ['company-services', selectedCompany],
    queryFn: () => companies.getServices(selectedCompany),
    enabled: !!selectedCompany,
  });

  // Query para buscar serviços de todas as empresas
  const { data: allCompanyServices } = useQuery<Service[]>({
    queryKey: ['all-company-services'],
    queryFn: async () => {
      if (!companiesList) return [];
      const servicesPromises = companiesList.map(company => 
        companies.getServices(company.id)
      );
      const servicesArrays = await Promise.all(servicesPromises);
      return servicesArrays.flat();
    },
    enabled: !!companiesList,
  });

  // Função para buscar o nome do serviço
  const getServiceName = (vote: Vote): string => {
    if (!allCompanyServices) return 'Serviço não especificado';
    const service = allCompanyServices.find(s => s.id === vote.id_tipo_servico);
    return service?.nome || 'Serviço não especificado';
  };

  // Reset selectedService quando a empresa muda
  React.useEffect(() => {
    setSelectedService('');
  }, [selectedCompany]);

  // Mutations
  const createVoteMutation = useMutation({
    mutationFn: votes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      toast({
        title: 'Voto registrado!',
        description: 'Obrigado pela sua avaliação.',
      });
      setIsDialogOpen(false);
      setSelectedCompany('');
      setSelectedService('');
      setRating('');
      setComment('');
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar voto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteVoteMutation = useMutation({
    mutationFn: votes.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['votes'] });
      toast({
        title: 'Voto removido!',
        description: 'O voto foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover voto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreateVote = () => {
    if (!selectedCompany || !selectedService || !rating) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    createVoteMutation.mutate({
      id_empresa: selectedCompany,
      id_tipo_servico: selectedService,
      avaliacao: rating,
      comentario: comment,
    });
  };

  const handleRefresh = () => {
    refetch();
    toast({ title: 'Atualizado', description: 'Lista de votos atualizada.' });
  };

  // Busca: empresa, serviço, avaliação ou comentário
  const filteredVotes = votesList?.filter((vote) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const companyName = companiesList?.find((c) => c.id === vote.id_empresa)?.nome?.toLowerCase() ?? '';
    const serviceName = getServiceName(vote).toLowerCase();
    const ratingStr = vote.avaliacao?.toLowerCase() ?? '';
    const commentStr = (vote.comentario ?? '').toLowerCase();
    return (
      companyName.includes(term) ||
      serviceName.includes(term) ||
      ratingStr.includes(term) ||
      commentStr.includes(term)
    );
  });

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return 'text-green-500';
      case 'Bom':
        return 'text-blue-500';
      case 'Regular':
        return 'text-yellow-500';
      case 'Ruim':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'Ótimo':
        return <Heart className="h-4 w-4 fill-current" />;
      case 'Bom':
        return <ThumbsUp className="h-4 w-4" />;
      case 'Regular':
        return <Star className="h-4 w-4" />;
      case 'Ruim':
        return <ThumbsDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Função para truncar o texto
  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
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
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Votos
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os votos e avaliações registrados no sistema.
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden xs:inline">Atualizar</span>
                </Button>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Voto
                </Button>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, serviço, avaliação ou comentário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4"
            />
          </div>

          {/* Conteúdo */}
          {isLoadingVotes ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-48 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : votesError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <p className="font-medium text-destructive">Erro ao carregar votos</p>
              <Button variant="outline" onClick={() => refetch()} className="mt-4">
                Tentar novamente
              </Button>
            </div>
          ) : votesList?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <ThumbsUp className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum voto registrado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Os votos aparecerão aqui quando forem registrados.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Novo Voto
              </Button>
            </div>
          ) : filteredVotes?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum resultado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Nenhum voto encontrado para &quot;{searchTerm}&quot;. Tente outro termo.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {filteredVotes?.map((vote) => (
                <Card key={vote.id_voto} className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-primary" />
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <CardTitle className="truncate text-lg">
                                {companiesList?.find((c) => c.id === vote.id_empresa)?.nome || 'Empresa'}
                              </CardTitle>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{companiesList?.find((c) => c.id === vote.id_empresa)?.nome}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-border bg-card">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover voto</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este voto? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteVoteMutation.mutate(vote.id_voto)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <LayoutList className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm text-muted-foreground">
                          {getServiceName(vote)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRatingIcon(vote.avaliacao)}
                        <span className={cn('font-medium', getRatingColor(vote.avaliacao))}>
                          {vote.avaliacao}
                        </span>
                      </div>
                      {vote.comentario && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{vote.comentario}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(vote.momento_voto), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Voto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto border-border bg-card p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold sm:text-xl">Registrar Novo Voto</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para registrar um novo voto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companiesList?.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.nome || 'Empresa sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serviço</label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={!selectedCompany}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {companyServices?.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Avaliação</label>
              <Select value={rating} onValueChange={setRating}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecione uma avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ótimo">Ótimo</SelectItem>
                  <SelectItem value="Bom">Bom</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Ruim">Ruim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Comentário</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Digite seu comentário (opcional)"
                className="min-h-[80px] resize-y"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateVote}
              disabled={createVoteMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createVoteMutation.isPending ? 'Registrando...' : 'Registrar Voto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Votes; 