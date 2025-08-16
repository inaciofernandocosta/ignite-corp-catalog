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
  image?: string;
  duration: string;
  startDate?: string;
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
      {/* Course Image */}
      {immersion.image ? (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={immersion.image} 
            alt={immersion.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges overlay on image */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="outline" className="text-xs font-medium bg-black/50 border-white/20 text-white">
              {accessInfo.label}
            </Badge>
            {immersion.badges?.map((badge) => (
              <Badge key={badge} variant={badge === 'new' ? 'new' : 'popular'} className="text-xs">
                {badge === 'new' ? 'Novo' : 'Mais procurado'}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        /* Badges without image */
        <div className="p-4 pb-0">
          <div className="flex gap-2 mb-3">
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
      )}
      
      <CardHeader className={`pb-4 ${!immersion.image ? 'pt-0' : ''}`}>
        {/* Title */}
        <h3 className="font-heading font-bold text-lg sm:text-xl leading-tight text-card-foreground group-hover:text-primary transition-colors mb-3">
          {immersion.title}
        </h3>
        
        {/* Course Info */}
        <div className="space-y-2 mb-4">
          {immersion.duration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{immersion.duration}</span>
            </div>
          )}
          
          {immersion.startDate && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Início: {new Date(immersion.startDate).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
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