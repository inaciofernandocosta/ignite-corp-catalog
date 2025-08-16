import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

interface Filter {
  id: string;
  label: string;
  category: string;
}

interface FilterSectionProps {
  onFiltersChange: (filters: Filter[]) => void;
  resultCount: number;
}

const FILTER_OPTIONS = {
  tema: [
    { id: "ia-aplicada", label: "IA Aplicada", category: "tema" },
    { id: "data-analytics", label: "Data & Analytics", category: "tema" },
    { id: "seguranca", label: "Segurança/Compliance", category: "tema" },
    { id: "dev-mlops", label: "Dev & MLOps", category: "tema" }
  ],
  nivel: [
    { id: "intro", label: "Introdutório", category: "nivel" },
    { id: "intermediario", label: "Intermediário", category: "nivel" },
    { id: "avancado", label: "Avançado", category: "nivel" }
  ],
  formato: [
    { id: "ao-vivo", label: "Ao vivo", category: "formato" },
    { id: "on-demand", label: "On-demand", category: "formato" }
  ],
  carga: [
    { id: "4h", label: "4 horas", category: "carga" },
    { id: "8h", label: "8 horas", category: "carga" },
    { id: "16h", label: "16 horas", category: "carga" },
    { id: "24h+", label: "24h+", category: "carga" }
  ],
  idioma: [
    { id: "portugues", label: "Português", category: "idioma" },
    { id: "ingles", label: "Inglês", category: "idioma" }
  ]
};

export function FilterSection({ onFiltersChange, resultCount }: FilterSectionProps) {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleFilter = (filter: Filter) => {
    const isActive = activeFilters.some(f => f.id === filter.id);
    let newFilters;
    
    if (isActive) {
      newFilters = activeFilters.filter(f => f.id !== filter.id);
    } else {
      newFilters = [...activeFilters, filter];
    }
    
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const removeFilter = (filterId: string) => {
    const newFilters = activeFilters.filter(f => f.id !== filterId);
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    onFiltersChange([]);
  };

  return (
    <section className="bg-background border-b py-6">
      <div className="container mx-auto px-4">
        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">
              Filtros ativos:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter.id}
                variant="secondary"
                className="cursor-pointer hover:bg-secondary-hover transition-colors"
                onClick={() => removeFilter(filter.id)}
              >
                {filter.label}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Limpar todos
            </Button>
          </div>
        )}

        {/* Filter Categories */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center text-sm text-muted-foreground mr-4">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar por:
          </div>
          
          {Object.entries(FILTER_OPTIONS).map(([category, options]) => (
            <div key={category} className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExpandedCategory(
                  expandedCategory === category ? null : category
                )}
                className={`capitalize ${
                  activeFilters.some(f => f.category === category)
                    ? 'bg-primary-light border-primary text-primary'
                    : ''
                }`}
              >
                {category === 'tema' && 'Tema'}
                {category === 'nivel' && 'Nível'}
                {category === 'formato' && 'Formato'}
                {category === 'carga' && 'Carga horária'}
                {category === 'idioma' && 'Idioma'}
                {activeFilters.filter(f => f.category === category).length > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
                    {activeFilters.filter(f => f.category === category).length}
                  </Badge>
                )}
              </Button>
              
              {expandedCategory === category && (
                <div className="absolute top-full left-0 mt-2 bg-popover border rounded-lg shadow-card p-2 min-w-48 z-10">
                  {options.map((option) => (
                    <Button
                      key={option.id}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start text-left ${
                        activeFilters.some(f => f.id === option.id)
                          ? 'bg-primary-light text-primary'
                          : ''
                      }`}
                      onClick={() => toggleFilter(option)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          {resultCount} imersões encontradas
        </div>
      </div>
    </section>
  );
}