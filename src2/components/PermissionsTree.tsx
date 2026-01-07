import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  File,
  Loader2,
  LayoutDashboard,
  Settings,
  Users,
  Shield,
  Search,
  FileText,
  Smartphone,
  Building2,
  ClipboardList,
  Key,
  BarChart,
  Building,
  LayoutList,
  ThumbsUp,

  Monitor,
  Calendar,
  PieChart,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: string;
  permission: string;
  has_permission: boolean;
  user_id: string;
}

interface PermissionCategory {
  name: string;
  icon: React.ReactNode;
  permissions: {
    key: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

interface PermissionsTreeProps {
  permissions?: Permission[];
  onPermissionChange: (permission: string, has_permission: boolean) => void;
  isLoading?: boolean;
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Menu Principal',
    icon: <LayoutDashboard className="h-4 w-4" />,
    permissions: [
      { key: 'dashboard', label: 'Dashboard', icon: <BarChart className="h-4 w-4" /> },
      { key: 'gestao', label: 'Monitor', icon: <Monitor className="h-4 w-4" /> },
      { key: 'cadastros_companies', label: 'Empresas', icon: <Building className="h-4 w-4" /> },
      { key: 'cadastros_service_types', label: 'Tipos de Serviço', icon: <LayoutList className="h-4 w-4" /> },
      { key: 'pesquisas_votes', label: 'Votos', icon: <ThumbsUp className="h-4 w-4" /> },
      { key: 'autorizacoes_users', label: 'Usuários', icon: <Users className="h-4 w-4" /> },
      { key: 'relatorios', label: 'Relatórios', icon: <FileText className="h-4 w-4" /> },
    ],
  },
];

export const PermissionsTree: React.FC<PermissionsTreeProps> = ({
  permissions = [],
  onPermissionChange,
  isLoading = false
}) => {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const getPermissionValue = (permissionKey: string) => {
    if (!permissions || permissions.length === 0) return false;
    const permission = permissions.find(p => p.permission === permissionKey);
    return permission?.has_permission || false;
  };

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2">
          {PERMISSION_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-1">
              <button
                onClick={() => toggleCategory(category.name)}
                className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                {expandedCategories.includes(category.name) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {category.icon}
                <span>{category.name}</span>
              </button>
              {expandedCategories.includes(category.name) && (
                <div className="ml-6 space-y-1">
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                    >
                      {permission.icon}
                      <Checkbox
                        id={permission.key}
                        checked={getPermissionValue(permission.key)}
                        onCheckedChange={(checked) =>
                          onPermissionChange(permission.key, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={permission.key}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}; 