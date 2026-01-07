import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companies, serviceTypes } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateCompanyServiceRequest, CompanyService } from '@/types/company';
import { ServiceType } from '@/types/serviceType';

interface AddCompanyServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  service?: CompanyService | null;
  onSuccess: () => void;
}

const AddCompanyServiceDialog: React.FC<AddCompanyServiceDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  service,
  onSuccess,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateCompanyServiceRequest>({
    tipo_servico: '',
    nome: '',
    hora_inicio: '',
    hora_final: '',
    user_add: 'admin',
    qtd_ref: 0,
  });

  const { data: serviceTypesData, isLoading: isLoadingServiceTypes } = useQuery({
    queryKey: ['service-types'],
    queryFn: serviceTypes.getAll,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        tipo_servico: service.tipo_servico,
        nome: service.nome,
        hora_inicio: service.hora_inicio,
        hora_final: service.hora_final,
        user_add: service.user_add,
        qtd_ref: service.qtd_ref || 0, // ✅ presente no modo edição
      });
    } else {
      setFormData({
        tipo_servico: '',
        nome: '',
        hora_inicio: '',
        hora_final: '',
        user_add: 'admin',
        qtd_ref: 0, // ✅ também presente no modo criação
      });
    }
  }, [service]);

  const createServiceMutation = useMutation({
    mutationFn: (data: CreateCompanyServiceRequest) =>
      companies.addService(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services', companyId] });
      onSuccess();
      onOpenChange(false);
      toast({ title: 'Serviço adicionado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: (data: CreateCompanyServiceRequest) =>
      companies.updateService(companyId, service!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-services', companyId] });
      onSuccess();
      onOpenChange(false);
      toast({ title: 'Serviço atualizado com sucesso' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (service) {
      updateServiceMutation.mutate(formData);
    } else {
      createServiceMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Editar Serviço' : 'Adicionar Serviço'}</DialogTitle>
          <DialogDescription>
            {service ? 'Edite as informações do serviço.' : 'Adicione um novo serviço para esta empresa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo_servico">Tipo de Serviço</Label>
            <Select
              value={formData.tipo_servico}
              onValueChange={(value) => setFormData({ ...formData, tipo_servico: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingServiceTypes ? (
                  <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                ) : serviceTypesData?.length ? (
                  serviceTypesData.map((type: ServiceType) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.nome}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">Nenhum tipo de serviço</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Digite o nome do serviço"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio">Hora Início</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_final">Hora Final</Label>
              <Input
                id="hora_final"
                type="time"
                value={formData.hora_final}
                onChange={(e) => setFormData({ ...formData, hora_final: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtd_ref">Quantidade de Refeições</Label>
            <Input
              id="qtd_ref"
              type="number"
              value={formData.qtd_ref}
              onChange={(e) => setFormData({ ...formData, qtd_ref: Number(e.target.value) })}
              placeholder="Digite a quantidade de refeições"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
            >
              {createServiceMutation.isPending || updateServiceMutation.isPending
                ? (service ? 'Salvando...' : 'Adicionando...')
                : (service ? 'Salvar' : 'Adicionar')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyServiceDialog;
