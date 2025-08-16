import { User, Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

interface HeaderProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onLogin: () => void;
}

export function Header({ userState, onLogin }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            onClick={() => {
              if (userState === 'visitor') {
                window.location.href = '/';
              } else {
                window.location.href = '/dashboard';
              }
            }}
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl text-foreground">
                Mentoria Futura
              </h1>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">Educação Corporativa</p>
            </div>
          </button>

          {/* Desktop Navigation */}
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

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userState === 'visitor' ? (
              <div className="flex items-center space-x-3">
                <Button onClick={onLogin} variant="outline" size="sm" className="border-border hover:bg-secondary">
                  Entrar
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  {profile?.email || 'usuário@email.com'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    signOut();
                    window.location.href = '/';
                  }}
                >
                  Sair
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 mt-4">
              <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Programas
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Experiências
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nós
              </a>
              
              <div className="pt-4 border-t border-border">
                {userState === 'visitor' ? (
                  <div className="flex flex-col space-y-3">
                    <Button onClick={onLogin} variant="outline" size="sm" className="border-border hover:bg-secondary w-full">
                      Entrar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <div className="text-sm text-muted-foreground">
                      {profile?.email || 'usuário@email.com'}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border w-full"
                      onClick={() => window.location.href = '/dashboard'}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        signOut();
                        window.location.href = '/';
                      }}
                    >
                      Sair
                    </Button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}