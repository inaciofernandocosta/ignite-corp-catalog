import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users } from 'lucide-react';

interface DepartmentEnrollmentStatusProps {
  departamento: string;
  isLimitReached: boolean;
  currentCount?: number;
  maxLimit?: number;
  className?: string;
}

export const DepartmentEnrollmentStatus: React.FC<DepartmentEnrollmentStatusProps> = ({
  departamento,
  isLimitReached,
  currentCount,
  maxLimit,
  className = '',
}) => {
  if (!isLimitReached) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant="secondary" 
        className="bg-gray-100 text-gray-600 hover:bg-gray-100 cursor-default"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        {departamento}
      </Badge>
      <span className="text-xs text-gray-500">
        Limite de vaga excedido
        {currentCount && maxLimit && (
          <span className="ml-1">({currentCount}/{maxLimit})</span>
        )}
      </span>
    </div>
  );
};

interface DepartmentLimitsDisplayProps {
  departmentLimitsReached: string[];
  className?: string;
}

export const DepartmentLimitsDisplay: React.FC<DepartmentLimitsDisplayProps> = ({
  departmentLimitsReached,
  className = '',
}) => {
  if (departmentLimitsReached.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Users className="h-4 w-4" />
        Departamentos com limite atingido:
      </div>
      <div className="space-y-1">
        {departmentLimitsReached.map((dept) => (
          <DepartmentEnrollmentStatus
            key={dept}
            departamento={dept}
            isLimitReached={true}
          />
        ))}
      </div>
    </div>
  );
};