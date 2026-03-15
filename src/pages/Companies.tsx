import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { companies } from '@/services/api';
import { Company } from '@/types/company';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, RefreshCw, Search, Building2, LayoutList } from 'lucide-react';
import AddCompanyDialog from '@/components/AddCompanyDialog';
import CompanyCard from '@/components/CompanyCard';
import { cn } from '@/lib/utils';

const Companies: React.FC = () => {
  const { toast } = useToast();
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>();

  const {
    data: companiesData,
    isLoading: companiesLoading,
    error: companiesError,
    refetch: refetchCompanies,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: companies.getAll,
  });

  const handleRefresh = () => {
    refetchCompanies();
    toast({
      title: 'Atualizado',
      description: 'Lista de empresas atualizada com sucesso',
    });
  };

  const filteredCompanies = companiesData?.filter((company: Company) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      company.nome?.toLowerCase().includes(searchLower) ||
      company.razao_social?.toLowerCase().includes(searchLower) ||
      company.cnpj?.includes(searchLower) ||
      company.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = async (id: string) => {
    try {
      await companies.delete(id);
      refetchCompanies();
      toast({
        title: 'Empresa excluída',
        description: 'Empresa excluída com sucesso',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir empresa',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setIsAddCompanyOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Header no estilo Dashboard/Monitor */}
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
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
                    Empresas
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie as empresas que podem ser avaliadas pelos usuários.
                  </p>
                </div>
              </div>
              <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden xs:inline">Atualizar</span>
                </Button>
                <Button
                  onClick={() => {
                    setSelectedCompany(undefined);
                    setIsAddCompanyOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nova Empresa
                </Button>
              </div>
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, razão social, CNPJ ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-9 pr-4"
            />
          </div>

          {/* Conteúdo */}
          {companiesLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="h-48 rounded-xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : companiesError ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
              <p className="text-destructive font-medium">Erro ao carregar empresas</p>
              <Button
                variant="outline"
                onClick={() => refetchCompanies()}
                className="mt-4"
              >
                Tentar novamente
              </Button>
            </div>
          ) : companiesData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <LayoutList className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhuma empresa cadastrada</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Adicione empresas para que possam ser avaliadas pelos usuários.
              </p>
              <Button
                onClick={() => setIsAddCompanyOpen(true)}
                className="mt-6 gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Empresa
              </Button>
            </div>
          ) : filteredCompanies?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
              <Search className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">Nenhum resultado</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Nenhuma empresa encontrada para &quot;{searchTerm}&quot;. Tente outro termo.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')} className="mt-6">
                Limpar busca
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
        </div>
      </div>

      <AddCompanyDialog
        open={isAddCompanyOpen}
        onOpenChange={setIsAddCompanyOpen}
        onSuccess={() => {
          refetchCompanies();
          setSelectedCompany(undefined);
          toast({
            title: selectedCompany ? 'Empresa atualizada' : 'Empresa adicionada',
            description: selectedCompany
              ? 'Empresa atualizada com sucesso'
              : 'Empresa adicionada com sucesso',
          });
        }}
        company={selectedCompany}
      />
    </div>
  );
};

export default Companies;
