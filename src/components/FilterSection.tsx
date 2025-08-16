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
  // Filters removed as per user request
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
        {/* Filter Categories - Removed as per user request */}

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