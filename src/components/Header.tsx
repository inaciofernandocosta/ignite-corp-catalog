import { User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onLogin: () => void;
}

export function Header({ userState, onLogin }: HeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                Mentoria Futura
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Educação Corporativa</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Programas
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Experiências
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sobre Nós
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {userState === 'visitor' ? (
              <div className="flex items-center space-x-3">
                <Button onClick={onLogin} variant="outline" size="sm" className="border-border hover:bg-secondary">
                  Entrar
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary-hover font-semibold">
                  Aplique-se
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {userState === 'logged-corporate' && "colaborador@empresa.com.br"}
                  {userState === 'logged-personal' && "usuario@gmail.com"}
                  {userState === 'logged-no-company' && "colaborador@naoregistrada.com"}
                </span>
                <Button variant="outline" size="sm" className="border-border">
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