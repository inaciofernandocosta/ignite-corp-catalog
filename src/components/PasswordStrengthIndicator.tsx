import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  text: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator = ({ password, className }: PasswordStrengthIndicatorProps) => {
  const requirements: PasswordRequirement[] = [
    {
      text: 'Pelo menos 6 caracteres',
      met: password.length >= 6,
    },
    {
      text: 'Pelo menos uma letra minúscula',
      met: /[a-z]/.test(password),
    },
    {
      text: 'Pelo menos uma letra maiúscula',
      met: /[A-Z]/.test(password),
    },
    {
      text: 'Pelo menos um número',
      met: /\d/.test(password),
    },
  ];

  const metRequirements = requirements.filter(req => req.met).length;
  const strengthLevel = metRequirements === 0 ? 'weak' : 
                       metRequirements <= 2 ? 'medium' : 'strong';

  const getStrengthColor = () => {
    switch (strengthLevel) {
      case 'weak': return 'text-destructive';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStrengthText = () => {
    switch (strengthLevel) {
      case 'weak': return 'Fraca';
      case 'medium': return 'Média';
      case 'strong': return 'Forte';
      default: return '';
    }
  };

  if (!password) return null;

  return (
    <div className={cn("space-y-3 p-4 bg-muted/50 rounded-lg border", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Força da senha:</span>
        <span className={cn("text-sm font-semibold", getStrengthColor())}>
          {getStrengthText()}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-2">Requisitos:</div>
        {requirements.map((requirement, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {requirement.met ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <X className="h-3 w-3 text-destructive" />
            )}
            <span className={cn(
              requirement.met ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {requirement.text}
            </span>
          </div>
        ))}
      </div>

      {/* Barra de progresso visual */}
      <div className="space-y-1">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              strengthLevel === 'weak' && "bg-destructive w-1/4",
              strengthLevel === 'medium' && "bg-yellow-500 w-2/4",
              strengthLevel === 'strong' && "bg-green-500 w-full"
            )}
          />
        </div>
      </div>
    </div>
  );
};