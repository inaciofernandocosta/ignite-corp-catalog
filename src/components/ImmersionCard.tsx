import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Lock, CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { formatDateWithoutTimezone } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "@/hooks/useCourseDetails";

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
  slug?: string; // Adicionar campo slug
}

interface ImmersionCardProps {
  immersion: Immersion;
  userState: 'visitor' | 'logged-corporate' | 'logged-personal' | 'logged-no-company';
  accessState?: 'available' | 'not-in-plan' | 'locked';
  enrollmentStatus?: {status: string; data_inscricao: string};
  onCTAClick: (immersion: Immersion) => void; // Corrigir para passar o objeto completo
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

export function ImmersionCard({ immersion, userState, accessState, enrollmentStatus, onCTAClick }: ImmersionCardProps) {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    // Use existing slug or generate from title
    const slug = immersion.slug || generateSlug(immersion.title);
    navigate(`/curso/${slug}`);
  };
  
  const getAccessInfo = () => {
    // Se o usuário tem uma inscrição existente, mostrar o status
    if (enrollmentStatus) {
      const buttonStyles = {
        pendente: {
          icon: <Clock className="w-4 h-4" />,
          label: "Programa Presencial",
          badgeVariant: "outline" as const,
          ctaText: "Aguardando aprovação",
          ctaVariant: "secondary" as const,
          showTeaser: false,
          isLocked: true,
          showButton: true
        },
        aprovado: {
          icon: <CheckCircle className="w-4 h-4" />,
          label: "Programa Presencial",
          badgeVariant: "outline" as const,
          ctaText: "Inscrito",
          ctaVariant: "secondary" as const,
          showTeaser: false,
          isLocked: true,
          showButton: true
        },
        reprovado: {
          icon: <XCircle className="w-4 h-4" />,
          label: "Programa Presencial",
          badgeVariant: "outline" as const,
          ctaText: "Inscrição negada",
          ctaVariant: "secondary" as const,
          showTeaser: false,
          isLocked: true,
          showButton: true
        }
      };
      
      return buttonStyles[enrollmentStatus.status as keyof typeof buttonStyles] || buttonStyles['pendente'];
    }
    
    if (userState === 'visitor' || userState === 'logged-personal' || userState === 'logged-no-company') {
      return {
        icon: <Lock className="w-4 h-4" />,
        label: "Programa Presencial",
        badgeVariant: "outline" as const,
        ctaText: "Quero me aplicar",
        ctaVariant: "default" as const,
        showTeaser: true,
        isLocked: true,
        showButton: true
      };
    }

    if (userState === 'logged-corporate') {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Programa Presencial",
        badgeVariant: "outline" as const,
        ctaText: "Inscrever-se",
        ctaVariant: "default" as const,
        showTeaser: false,
        isLocked: false,
        showButton: true
      };
    }

    return {
      icon: <Lock className="w-4 h-4" />,
      label: "Programa Presencial",
      badgeVariant: "outline" as const,
      ctaText: "Ver detalhes",
      ctaVariant: "outline" as const,
      showTeaser: true,
      isLocked: true,
      showButton: true
    };
  };

  const accessInfo = getAccessInfo();

  return (
    <Card 
      className="group hover:shadow-card-hover transition-all duration-300 bg-gradient-card border-border overflow-hidden cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Course Image */}
      {immersion.image ? (
        <div className="relative h-40 sm:h-48 overflow-hidden flex-shrink-0">
          <img 
            src={immersion.image} 
            alt={immersion.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Badges overlay on image */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2 flex-wrap">
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
        <div className="p-3 sm:p-4 pb-0">
          <div className="flex gap-1 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
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
      
      <CardHeader className={`pb-3 sm:pb-4 px-3 sm:px-6 flex-grow ${!immersion.image ? 'pt-0' : 'pt-3 sm:pt-6'}`}>
        {/* Title */}
        <h3 className="font-heading font-bold text-base sm:text-lg lg:text-xl leading-tight text-card-foreground group-hover:text-primary transition-colors mb-2 sm:mb-3 line-clamp-2">
          {immersion.title}
        </h3>
        
        {/* Course Info */}
        <div className="space-y-1 sm:space-y-2 mb-3 sm:mb-4">
          {immersion.duration && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Clock className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
              <span className="truncate">{immersion.duration}</span>
            </div>
          )}
          
          {immersion.startDate && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
              <span className="truncate">Início: {formatDateWithoutTimezone(immersion.startDate)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
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

      <CardFooter className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6 flex-shrink-0">
        {accessInfo.showButton && (
          <Button
            variant={accessInfo.ctaVariant}
            size="sm"
            className="w-full font-semibold py-2 sm:py-3 text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when button is clicked
              onCTAClick(immersion);
            }}
          >
            {accessInfo.ctaText}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}