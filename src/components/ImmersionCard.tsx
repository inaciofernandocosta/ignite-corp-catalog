import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Users, Lock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface Immersion {
  id: string;
  title: string;
  tags: string[];
  level: 'intro' | 'intermediate' | 'advanced';
  format: 'live' | 'on-demand';
  workloadHours: number;
  nextClass?: string;
  badges?: ('new' | 'popular')[];
  description?: string;
}

interface ImmersionCardProps {
  immersion: Immersion;
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  accessState?: 'available' | 'not-in-plan' | 'locked';
  onCTAClick: (immersionId: string, action: string) => void;
}

const levelLabels = {
  intro: 'Introdutório',
  intermediate: 'Intermediário', 
  advanced: 'Avançado'
};

const levelColors = {
  intro: 'success',
  intermediate: 'warning',
  advanced: 'destructive'
} as const;

export function ImmersionCard({ immersion, userState, accessState, onCTAClick }: ImmersionCardProps) {
  const getAccessInfo = () => {
    if (userState === 'visitor') {
      return {
        icon: <Lock className="w-4 h-4" />,
        label: "Somente empresas cadastradas",
        badgeVariant: "locked" as const,
        ctaText: "Ver preview",
        ctaVariant: "outline" as const,
        showTeaser: true
      };
    }

    if (userState === 'logged-personal') {
      return {
        icon: <Lock className="w-4 h-4" />,
        label: "Use e-mail corporativo",
        badgeVariant: "locked" as const,
        ctaText: "Entrar com e-mail corporativo",
        ctaVariant: "outline" as const,
        showTeaser: true
      };
    }

    if (userState === 'logged-no-company') {
      return {
        icon: <Lock className="w-4 h-4" />,
        label: "Empresa não cadastrada",
        badgeVariant: "locked" as const,
        ctaText: "Contratar para minha empresa",
        ctaVariant: "default" as const,
        showTeaser: true
      };
    }

    if (userState === 'logged-corporate') {
      if (accessState === 'not-in-plan') {
        return {
          icon: <HelpCircle className="w-4 h-4" />,
          label: "Não incluído no seu plano",
          badgeVariant: "warning" as const,
          ctaText: "Solicitar liberação ao RH/TI",
          ctaVariant: "outline" as const,
          showTeaser: false
        };
      }

      return {
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Disponível pela sua empresa",
        badgeVariant: "available" as const,
        ctaText: "Inscrever-se",
        ctaVariant: "default" as const,
        showTeaser: false
      };
    }

    return {
      icon: <Lock className="w-4 h-4" />,
      label: "Acesso restrito",
      badgeVariant: "locked" as const,
      ctaText: "Verificar acesso",
      ctaVariant: "outline" as const,
      showTeaser: true
    };
  };

  const accessInfo = getAccessInfo();

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors">
              {immersion.title}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1 ml-4">
            {immersion.badges?.map((badge) => (
              <Badge key={badge} variant={badge === 'new' ? 'new' : 'popular'} className="text-xs">
                {badge === 'new' ? 'Novo' : 'Mais procurado'}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {immersion.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Badge variant={levelColors[immersion.level]} className="text-xs">
            {levelLabels[immersion.level]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {accessInfo.showTeaser ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {immersion.description || "Uma imersão prática e especializada para acelerar sua carreira em tecnologia..."}
            </p>
            <div className="bg-muted/50 backdrop-blur p-3 rounded-lg border-l-4 border-muted-foreground/20">
              <p className="text-xs text-muted-foreground">
                Conteúdo completo disponível apenas para empresas cadastradas
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-card-foreground">
              {immersion.description || "Uma imersão prática e especializada que combina teoria e aplicação real, desenvolvida por especialistas da indústria."}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="w-3 h-3 mr-1" />
            {immersion.workloadHours}h
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Users className="w-3 h-3 mr-1" />
            {immersion.format === 'live' ? 'Ao vivo' : 'On-demand'}
          </div>
          {immersion.nextClass && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(immersion.nextClass).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full space-y-3">
          <div className="flex items-center gap-2">
            {accessInfo.icon}
            <Badge variant={accessInfo.badgeVariant} className="text-xs">
              {accessInfo.label}
            </Badge>
          </div>
          
          <Button
            variant={accessInfo.ctaVariant}
            size="sm"
            className="w-full transition-smooth"
            onClick={() => onCTAClick(immersion.id, accessInfo.ctaText)}
          >
            {accessInfo.ctaText}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}