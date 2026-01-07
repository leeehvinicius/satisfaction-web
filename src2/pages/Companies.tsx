import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companies } from '@/services/api';
import { Company } from '@/types/company';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Search, Pencil, Trash2, LayoutList } from 'lucide-react';
import AddCompanyDialog from '@/components/AddCompanyDialog';
import CompanyCard from '@/components/CompanyCard';
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

const Companies: React.FC = () => {
  const { toast } = useToast();
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>();

  const {
    data: companiesData,
    isLoading: companiesLoading,
    error: companiesError,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const handleRefresh = () => {
    refetchCompanies();
    toast({
      title: "Atualizado",
      description: "Lista de empresas atualizada com sucesso",
    });
  };

  const filteredCompanies = companiesData?.filter((company: Company) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.nome.toLowerCase().includes(searchLower) ||
      company.razao_social.toLowerCase().includes(searchLower) ||
      company.cnpj.includes(searchLower) ||
      company.email.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await companies.delete(id);
      refetchCompanies();
      toast({
        title: "Empresa excluída",
        description: "Empresa excluída com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsAddCompanyOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Empresas</h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie as empresas que podem ser avaliadas pelos usuários.
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
              onClick={() => {
                setSelectedCompany(undefined);
                setIsAddCompanyOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Empresa</span>
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {companiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="h-[160px] rounded-lg bg-secondary/30 animate-pulse"
              />
            ))}
          </div>
        ) : companiesError ? (
          <div className="text-center py-12">
            <p className="text-destructive text-lg">Erro ao carregar empresas</p>
            <Button
              variant="outline"
              onClick={() => refetchCompanies()}
              className="mt-4"
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            {companiesData?.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg border-border bg-secondary/20 flex flex-col items-center justify-center">
                <LayoutList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma empresa cadastrada</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Adicione empresas para que possam ser avaliadas pelos usuários.
                </p>
                <Button onClick={() => setIsAddCompanyOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Empresa
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCompanies?.map((company: Company) => (
                  <CompanyCard
                    key={company.id}
                    id={company.id}
                    nome={company.nome}
                    razao_social={company.razao_social}
                    cnpj={company.cnpj}
                    email={company.email}
                    telcom={company.telcom}
                    qt_funcionarios={company.qt_funcionarios}
                    linha={company.linha}
                    onEdit={() => handleEdit(company)}
                    onDelete={() => handleDelete(company.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AddCompanyDialog
        open={isAddCompanyOpen}
        onOpenChange={setIsAddCompanyOpen}
        onSuccess={() => {
          refetchCompanies();
          toast({
            title: selectedCompany ? "Empresa atualizada" : "Empresa adicionada",
            description: selectedCompany
              ? "Empresa atualizada com sucesso"
              : "Empresa adicionada com sucesso",
          });
        }}
        company={selectedCompany}
      />
    </div>
  );
};

export default Companies;
