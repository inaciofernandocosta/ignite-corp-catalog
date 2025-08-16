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
  carga: [
    { id: "1-dia", label: "1 dia", category: "carga" },
    { id: "2-dias", label: "2 dias", category: "carga" },
    { id: "3-dias", label: "3+ dias", category: "carga" }
  ]
};

export function FilterSection({ onFiltersChange, resultCount }: FilterSectionProps) {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

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
    <section className="bg-secondary/30 border-b border-border py-8">
      <div className="container mx-auto px-6">
        {/* Filter Categories */}
        <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
          {Object.entries(FILTER_OPTIONS).map(([category, options]) => (
            <div key={category} className="flex flex-wrap gap-2">
              {options.map((option) => (
                <Button
                  key={option.id}
                  variant={activeFilters.some(f => f.id === option.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter(option)}
                  className={`transition-all ${
                    activeFilters.some(f => f.id === option.id)
                      ? 'bg-primary text-primary-foreground'
                      : 'border-border hover:bg-secondary hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          ))}
        </div>

        {/* Active Filters & Clear */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <strong>{resultCount}</strong> imersões encontradas
          </div>
          
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}