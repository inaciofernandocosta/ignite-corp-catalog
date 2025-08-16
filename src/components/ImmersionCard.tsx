import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Users, Lock, CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface Immersion {
  id: string;
  title: string;
  tags: string[];
  level: 'intro' | 'intermediate' | 'advanced';
  workloadDays: number;
  nextClass: string;
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
    if (userState === 'visitor' || userState === 'logged-personal' || userState === 'logged-no-company') {
      return {
        icon: <Lock className="w-4 h-4" />,
        label: "Programa Presencial",
        badgeVariant: "outline" as const,
        ctaText: "Quero me aplicar",
        ctaVariant: "default" as const,
        showTeaser: true,
        isLocked: true
      };
    }

    if (userState === 'logged-corporate') {
      if (accessState === 'not-in-plan') {
        return {
          icon: <HelpCircle className="w-4 h-4" />,
          label: "Não incluído no plano",
          badgeVariant: "outline" as const,
          ctaText: "Solicitar liberação",
          ctaVariant: "outline" as const,
          showTeaser: false,
          isLocked: false
        };
      }

      return {
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Programa Presencial",
        badgeVariant: "outline" as const,
        ctaText: "Quero me aplicar",
        ctaVariant: "default" as const,
        showTeaser: false,
        isLocked: false
      };
    }

    return {
      icon: <Lock className="w-4 h-4" />,
      label: "Programa Presencial",
      badgeVariant: "outline" as const,
      ctaText: "Ver detalhes",
      ctaVariant: "outline" as const,
      showTeaser: true,
      isLocked: true
    };
  };

  const accessInfo = getAccessInfo();

  return (
    <Card className="group hover:shadow-card-hover transition-all duration-300 bg-gradient-card border-border overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs font-medium border-border">
              {accessInfo.label}
            </Badge>
            {immersion.badges?.map((badge) => (
              <Badge key={badge} variant={badge === 'new' ? 'new' : 'popular'} className="text-xs">
                {badge === 'new' ? 'Novo' : 'Mais procurado'}
              </Badge>
            ))}
          </div>
        </div>

        <h3 className="font-heading font-bold text-xl lg:text-2xl leading-tight text-card-foreground group-hover:text-primary transition-colors mb-3">
          {immersion.title}
        </h3>

        <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-4">
          {accessInfo.showTeaser 
            ? "Domine estratégias práticas e aplicáveis com metodologia exclusiva dos especialistas da indústria."
            : immersion.description
          }
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {immersion.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          <Badge variant={levelColors[immersion.level]} className="text-xs">
            {levelLabels[immersion.level]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Stats Section - G4 Style */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{immersion.workloadDays}</div>
            <div className="text-xs text-muted-foreground">{immersion.workloadDays === 1 ? 'DIA' : 'DIAS'}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">
              {new Date(immersion.nextClass).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xs text-muted-foreground">PRÓXIMA TURMA</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">SP</div>
            <div className="text-xs text-muted-foreground">PRESENCIAL</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant={accessInfo.ctaVariant}
          size="lg"
          className="w-full font-semibold py-3"
          onClick={() => onCTAClick(immersion.id, accessInfo.ctaText)}
        >
          {accessInfo.ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}