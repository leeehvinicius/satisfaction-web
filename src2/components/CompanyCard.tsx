import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Clock, ChevronDown, ChevronUp, BarChart2, Building2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { companies, serviceTypes as serviceTypesApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Company, CompanyService } from '@/types/company';
import AddCompanyServiceDialog from './AddCompanyServiceDialog';
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
import { Link } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface CompanyCardProps {
  id: string;
  nome: string;
  razao_social: string;
  cnpj: string;
  email: string;
  telcom: string;
  qt_funcionarios: number;
  linha: number;
  onEdit: () => void;
  onDelete: () => void;
}

const truncateText = (text: string, maxLength: number = 20) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

const formatCNPJ = (cnpj: string) => {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
};

const formatPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
};

const CompanyCard: React.FC<CompanyCardProps> = ({
  id,
  nome,
  razao_social,
  cnpj,
  email,
  telcom,
  qt_funcionarios,
  linha,
  onEdit,
  onDelete,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [selectedService, setSelectedService] = useState<CompanyService | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<CompanyService | null>(null);

  const { data: services, isLoading: isLoadingServices } = useQuery({
    queryKey: ['company-services', id],
    queryFn: () => companies.getServices(id),
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: serviceTypesApi.getAll,
  });

  const getServiceTypeName = (tipo_servico_id: string) => {
    return serviceTypes?.find((type) => type.id === tipo_servico_id)?.nome || tipo_servico_id;
  };

  const deleteMutation = useMutation({
    mutationFn: companies.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: "Empresa excluída",
        description: "Empresa excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditService = (service: CompanyService) => {
    setSelectedService(service);
    setIsAddServiceOpen(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await companies.deleteService(id, serviceId);
      queryClient.invalidateQueries({ queryKey: ['company-services', id] });
      toast({
        title: "Serviço excluído",
        description: "Serviço excluído com sucesso",
      });
      setServiceToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir serviço",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="bg-card rounded-lg border p-4 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-primary" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-medium text-lg">{truncateText(nome)}</h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{nome}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">{truncateText(razao_social)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedService(null); setIsAddServiceOpen(true); }} className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
            <Link to={`/monitor/${id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <BarChart2 className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">CNPJ:</span><span className="font-medium">{formatCNPJ(cnpj)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email:</span><span className="font-medium">{truncateText(email)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Telefone:</span><span className="font-medium">{formatPhone(telcom)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Qtd Refeiçoes:</span><span className="font-medium">{qt_funcionarios.toString()}</span></div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">Serviços</h4>
            <Button variant="ghost" size="sm" onClick={() => setIsServicesExpanded(!isServicesExpanded)} className="h-8 px-2">
              {isServicesExpanded ? (<><ChevronUp className="h-4 w-4 mr-1" />Ocultar</>) : (<><ChevronDown className="h-4 w-4 mr-1" />Ver Serviços</>)}
            </Button>
          </div>

          {isServicesExpanded && (
            <>
              {isLoadingServices ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, idx) => <div key={idx} className="h-8 bg-secondary/30 rounded animate-pulse" />)}
                </div>
              ) : services && services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((service: CompanyService) => (
                    <div key={service.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded group">
                      <div className="flex-1">
                        <p className="font-medium">{service.nome}</p>
                        <p className="text-sm text-muted-foreground">qtd: {getServiceTypeName(service.qtd_ref)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.hora_inicio} - {service.hora_final}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)} className="h-6 w-6">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Serviço</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o serviço "{service.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteService(service.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado</p>
              )}
            </>
          )}
        </div>
      </div>

      <AddCompanyServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        companyId={id}
        service={selectedService}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['company-services', id] })}
      />
    </>
  );
};

export default CompanyCard;