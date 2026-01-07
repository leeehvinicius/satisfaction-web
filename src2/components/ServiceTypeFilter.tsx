
import React, { useState, useEffect } from 'react';
import { serviceTypes } from '@/services/api';
import { Check, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';

interface ServiceType {
  id: string;
  name: string;
  description: string;
}

interface ServiceTypeFilterProps {
  onFilterChange: (selectedIds: string[]) => void;
  maxDisplayed?: number;
}

const ServiceTypeFilter: React.FC<ServiceTypeFilterProps> = ({ 
  onFilterChange,
  maxDisplayed = 3
}) => {
  const [serviceTypesList, setServiceTypesList] = useState<ServiceType[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch service types
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        setLoading(true);
        const response = await serviceTypes.getAll();
        setServiceTypesList(response);
      } catch (error) {
        console.error('Error fetching service types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceTypes();
  }, []);

  // Handle select/deselect of service type
  const toggleServiceType = (serviceId: string) => {
    setSelectedServices(prev => {
      const isSelected = prev.includes(serviceId);
      const newSelected = isSelected
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      
      // Notify parent component of filter change
      onFilterChange(newSelected);
      return newSelected;
    });
  };

  // Get display names for selected services
  const getSelectedServiceNames = () => {
    return selectedServices
      .map(id => serviceTypesList.find(st => st.id === id)?.name || '')
      .filter(Boolean);
  };

  const selectedServiceNames = getSelectedServiceNames();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 gap-1 bg-background/80 border-border/50"
          >
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Filtrar</span>
            {selectedServices.length > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-1 h-5 px-1 rounded-full text-xs bg-primary/20 text-primary border-primary/20"
              >
                {selectedServices.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[200px]" align="start">
          <Command>
            <CommandInput placeholder="Buscar tipo de serviço..." />
            <CommandList>
              <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
              <CommandGroup>
                {loading ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  serviceTypesList.map(service => (
                    <CommandItem
                      key={service.id}
                      onSelect={() => toggleServiceType(service.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                        selectedServices.includes(service.id) 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {selectedServices.includes(service.id) && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <span>{service.name}</span>
                    </CommandItem>
                  ))
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected filters */}
      {selectedServiceNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedServiceNames.slice(0, maxDisplayed).map((name, index) => (
            <Badge 
              key={index} 
              variant="secondary"
              className="bg-background border border-border/50 text-xs flex items-center gap-1"
            >
              {name}
              <button 
                onClick={() => toggleServiceType(
                  selectedServices[selectedServiceNames.indexOf(name)]
                )}
                className="text-muted-foreground hover:text-foreground ml-1"
              >
                ×
              </button>
            </Badge>
          ))}
          
          {selectedServiceNames.length > maxDisplayed && (
            <Badge variant="outline" className="text-xs bg-accent text-accent-foreground">
              +{selectedServiceNames.length - maxDisplayed}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ServiceTypeFilter;
