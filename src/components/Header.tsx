import { User, Building2, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  onLogin: () => void;
  onSignOut?: () => void;
}

export const Header = memo(({ userState, onLogin, onSignOut }: HeaderProps) => {
  const { profile, signOut, logoutLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogoClick = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleDashboardClick = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleSignOut = useCallback(() => {
    if (onSignOut) {
      onSignOut();
    } else {
      signOut(); // signOut já cuida do redirecionamento
    }
  }, [onSignOut, signOut]);

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity min-w-0"
            onClick={handleLogoClick}
          >
            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 sm:w-6 h-4 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-base sm:text-lg lg:text-xl text-foreground truncate">
                Mentoria Futura
              </h1>
              <p className="text-xs text-muted-foreground font-medium hidden sm:block">Educação Corporativa</p>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Programas
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              Experiências
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              Sobre Nós
            </a>
          </nav>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {userState === 'visitor' ? (
              <div className="flex items-center space-x-3">
                <Button onClick={onLogin} variant="outline" size="sm" className="border-border hover:bg-secondary">
                  Entrar
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 lg:space-x-3">
                <span className="text-sm text-muted-foreground truncate max-w-32 lg:max-w-40 xl:max-w-none">
                  {profile?.email || 'usuário@email.com'}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-border whitespace-nowrap"
                  onClick={handleDashboardClick}
                >
                  <User className="w-4 h-4 lg:mr-2" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={handleSignOut}
                  disabled={logoutLoading}
                >
                  {logoutLoading ? 'Saindo...' : 'Sair'}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 sm:mt-4 pb-3 sm:pb-4 border-t border-border">
            <nav className="flex flex-col space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Programas
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Experiências
              </a>
              <a href="#" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Sobre Nós
              </a>
              
              <div className="pt-3 sm:pt-4 border-t border-border">
                {userState === 'visitor' ? (
                  <div className="flex flex-col space-y-3">
                    <Button onClick={onLogin} variant="outline" size="sm" className="border-border hover:bg-secondary w-full">
                      Entrar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <div className="text-sm text-muted-foreground truncate">
                      {profile?.email || 'usuário@email.com'}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-border w-full"
                      onClick={handleDashboardClick}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="w-full"
                      onClick={handleSignOut}
                      disabled={logoutLoading}
                    >
                      {logoutLoading ? 'Saindo...' : 'Sair'}
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
});