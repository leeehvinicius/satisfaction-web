import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { votes, companies } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Company } from '@/types/company';
import { Service } from '@/types/service';
import { Vote } from '@/types/vote';
import Navbar from '@/components/Navbar';
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
  Heart
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TableCell } from '@/components/ui/table';
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

  // Queries
  const { data: companiesList } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const { data: votesList, refetch } = useQuery({
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

  const handleDeleteVote = (voteId: string) => {
    if (window.confirm('Tem certeza que deseja remover este voto?')) {
      deleteVoteMutation.mutate(voteId);
    }
  };

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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Votos</h1>
                <p className="text-muted-foreground">
                  Gerencie os votos e avaliações
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              className="hover:bg-primary/10"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Voto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Novo Voto</DialogTitle>
                  <DialogDescription>
                    Preencha os campos abaixo para registrar um novo voto.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Empresa</label>
                    <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                      <SelectTrigger>
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
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateVote}
                    disabled={createVoteMutation.isPending}
                  >
                    {createVoteMutation.isPending ? 'Registrando...' : 'Registrar Voto'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {votesList?.map((vote) => (
            <Card key={vote.id_voto} className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <CardTitle className="text-lg">
                            {truncateText(companiesList?.find(c => c.id === vote.id_empresa)?.nome || '')}
                          </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{companiesList?.find(c => c.id === vote.id_empresa)?.nome}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteVote(vote.id_voto)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <LayoutList className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getServiceName(vote)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getRatingIcon(vote.avaliacao)}
                    <span className={cn(
                      "font-medium",
                      getRatingColor(vote.avaliacao)
                    )}>
                      {vote.avaliacao}
                    </span>
                  </div>
                  {vote.comentario && (
                    <p className="text-sm text-muted-foreground">
                      {vote.comentario}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(vote.momento_voto), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Votes; 