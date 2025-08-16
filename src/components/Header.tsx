import { Search, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onSearch: (query: string) => void;
  onLogin: () => void;
}

export function Header({ userState, onSearch, onLogin }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                EduTech Pro
              </h1>
              <p className="text-xs text-muted-foreground">Para Empresas</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar imersões por título ou tema..."
                className="pl-10 bg-muted/50 border-border focus:bg-background transition-colors"
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {userState === 'visitor' ? (
              <Button onClick={onLogin} variant="outline" size="sm">
                <User className="w-4 h-4 mr-2" />
                Entrar
              </Button>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {userState === 'logged-corporate' && "colaborador@empresa.com.br"}
                  {userState === 'logged-personal' && "usuario@gmail.com"}
                  {userState === 'logged-no-company' && "colaborador@naoregistrada.com"}
                </span>
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}