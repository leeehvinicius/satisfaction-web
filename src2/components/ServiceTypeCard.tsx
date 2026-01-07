
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LayoutList, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceTypeCardProps {
  id: string;
  name: string;
  description: string;
}

const ServiceTypeCard: React.FC<ServiceTypeCardProps> = ({ 
  id, 
  name, 
  description 
}) => {
  return (
    <Card className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg interactive h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          </div>
        </div>
        <CardDescription className="text-sm text-muted-foreground truncate-text">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <Badge variant="outline" className="text-xs">
          Tipo de Serviço
        </Badge>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/service-types/${id}`} className="w-full">
          <Button variant="secondary" className="w-full group" size="sm">
            <span>Ver detalhes</span>
            <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ServiceTypeCard;
