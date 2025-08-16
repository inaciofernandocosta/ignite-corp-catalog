import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="sm:col-span-2 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-xl">Mentoria Futura</h3>
                <p className="text-xs text-background/70">Educação Corporativa</p>
              </div>
            </div>
            <p className="text-background/80 text-sm leading-relaxed max-w-md">
              Plataforma de educação corporativa especializada em IA e tecnologia. 
              Transforme o conhecimento da sua equipe com imersões práticas e certificações reconhecidas.
            </p>
          </div>

          {/* Contact B2B */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-background">Contato B2B</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-background/80">
                <Mail className="w-4 h-4 mr-2" />
                contato@mentoriafutura.com.br
              </div>
              <div className="flex items-center text-sm text-background/80">
                <Phone className="w-4 h-4 mr-2" />
                (11) 3000-0000
              </div>
              <Button variant="outline" size="sm" className="mt-4 bg-transparent border-background/30 text-background hover:bg-background/10 w-full sm:w-auto">
                Falar com especialista
              </Button>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-heading font-semibold mb-4 text-background">Legal</h4>
            <div className="space-y-2">
              <Link to="/termos-de-uso" className="block text-sm text-background/80 hover:text-background transition-colors">
                Termos de Uso
              </Link>
              <Link to="/politica-de-privacidade" className="block text-sm text-background/80 hover:text-background transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/lgpd" className="block text-sm text-background/80 hover:text-background transition-colors">
                LGPD
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/60 text-sm">
              © 2025 Mentoria Futura. Todos os direitos reservados.
            </p>
            <p className="text-background/60 text-sm mt-2 md:mt-0">
              CNPJ: 00.000.000/0001-00
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}