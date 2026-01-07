import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { companies } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Company } from '@/types/company';
import InputMask from 'react-input-mask';
import { Checkbox } from "@/components/ui/checkbox";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  company?: Company;
}

interface Line {
  value: number;
  label: string;
}

async function fetchAddress(cep: string) {
  const cleanedCep = cep.replace(/\D/g, '');
  if (cleanedCep.length !== 8) {
    return null;
  }
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    const data = await response.json();
    if (data.erro) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

const AddCompanyDialog: React.FC<AddCompanyDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
  company,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    razao_social: '',
    email: '',
    telcom: '',
    telcel: '',
    cnpj: '',
    qt_funcionarios: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    user_edt: user?.username || '',
    user_add: user?.username || '',
    linha: 0,
    qtdbutao: 3, // <== AQUI
  });

  const { data: lines } = useQuery({
    queryKey: ['company-lines'],
    queryFn: companies.getLines,
  });

  useEffect(() => {
    if (company) {
      setFormData({
        ...company,
        qt_funcionarios: company.qt_funcionarios.toString(),
        user_edt: user?.username || '',
      });
    } else {
      setFormData({
        nome: '',
        razao_social: '',
        email: '',
        telcom: '',
        telcel: '',
        cnpj: '',
        qt_funcionarios: '',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        user_edt: user?.username || '',
        user_add: user?.username || '',
        linha: 0,
        qtdbutao: 3, // <== AQUI
      });
    }
  }, [company, user?.username]);

  const createMutation = useMutation({
    mutationFn: companies.create,
    onSuccess: () => {
      onSuccess();
      onOpenChange(false);
      setFormData({
        nome: '',
        razao_social: '',
        email: '',
        telcom: '',
        telcel: '',
        cnpj: '',
        qt_funcionarios: '',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        user_edt: user?.username || '',
        user_add: user?.username || '',
        linha: 0,
      });
      setCurrentStep(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; data: any }) => companies.update(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onSuccess();
      onOpenChange(false);
      setFormData({
        nome: '',
        razao_social: '',
        email: '',
        telcom: '',
        telcel: '',
        cnpj: '',
        qt_funcionarios: '',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        user_edt: user?.username || '',
        user_add: user?.username || '',
        linha: 0,
      });
      setCurrentStep(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      qt_funcionarios: Number(formData.qt_funcionarios),
      qtdbutao: Number(formData.qtdbutao), // <== AQUI
      user_add: user?.username || '',
    };

    if (company) {
      updateMutation.mutate({ id: company.id, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };
  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCep = e.target.value;
    const formattedCep = rawCep.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    const cleanedCep = formattedCep.replace(/\D/g, '');

    setFormData((prev) => ({ ...prev, cep: formattedCep }));

    if (cleanedCep.length === 8) {
      const address = await fetchAddress(cleanedCep);
      if (address) {
        setFormData((prev) => ({
          ...prev,
          rua: address.logradouro || '',
          bairro: address.bairro || '',
          cidade: address.localidade || '',
          estado: address.uf || '',
        }));
      } else {
        toast({
          title: "CEP não encontrado",
          description: "Verifique se o CEP digitado está correto.",
          variant: "destructive",
        });
      }
    }
  };

  const steps = [
    {
      id: 'dados-basicos',
      title: 'Dados Básicos',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="razao_social">Razão Social</Label>
            <Input
              id="razao_social"
              value={formData.razao_social}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            {/* No campo de CNPJ */}
            <InputMask
              mask="99.999.999/9999-99"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            >
              {(inputProps) => <Input {...inputProps} id="cnpj" required />}
            </InputMask>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qt_funcionarios">Quantidade de Refeiçoes</Label>
            <Input
              id="qt_funcionarios"
              type="number"
              min="1"
              value={formData.qt_funcionarios}
              onChange={(e) => setFormData({ ...formData, qt_funcionarios: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="qtdbutao">Quantidade de Botões</Label>
            <select
              id="qtdbutao"
              value={formData.qtdbutao}
              onChange={(e) => setFormData({ ...formData, qtdbutao: Number(e.target.value) })}
              className="border border-gray-300 rounded px-3 py-2 w-full"
              required
            >
              <option value={3}>3 botões</option>
              <option value={4}>4 botões</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="linha"
                checked={formData.linha === 1}
                onCheckedChange={(checked) => setFormData({ ...formData, linha: checked ? 1 : 0 })}
              />
              <Label htmlFor="linha">Linha</Label>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'contato',
      title: 'Contato',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          {/* // Dentro do seu JSX */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telcom">Telefone Comercial</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telcom}
                onChange={(e) => setFormData({ ...formData, telcom: e.target.value })}
              >
                {(inputProps) => <Input {...inputProps} id="telcom" required />}
              </InputMask>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telcel">Telefone Celular</Label>
              <InputMask
                mask="(99) 99999-9999"
                value={formData.telcel}
                onChange={(e) => setFormData({ ...formData, telcel: e.target.value })}
              >
                {(inputProps) => <Input {...inputProps} id="telcel" required />}
              </InputMask>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'endereco',
      title: 'Endereço',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={handleCepChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rua">Rua</Label>
            <Input
              id="rua"
              value={formData.rua}
              onChange={(e) => setFormData({ ...formData, rua: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {company ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs value={steps[currentStep].id} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto sm:h-10">
              {steps.map((step, index) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  onClick={() => setCurrentStep(index)}
                  disabled={index > currentStep}
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3"
                >
                  {step.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {steps.map((step, index) => (
              <TabsContent key={step.id} value={step.id} className="mt-4 sm:mt-6">
                {step.content}
              </TabsContent>
            ))}
          </Tabs>
          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
            {currentStep === steps.length - 1 ? (
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? (company ? 'Salvando...' : 'Criando...')
                  : (company ? 'Salvar Alterações' : 'Criar Empresa')}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1))}
                className="w-full sm:w-auto"
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
