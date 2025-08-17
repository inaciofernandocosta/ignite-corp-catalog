import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Award } from 'lucide-react';

interface AdminStatsProps {
  totalStudents: number;
  activeCourses: number;
  totalCertificates: number;
}

export const AdminStats = ({ totalStudents, activeCourses, totalCertificates }: AdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Total de Alunos
          </CardTitle>
          <Users className="h-3 sm:h-4 w-3 sm:w-4 text-primary" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-xl sm:text-2xl font-bold text-primary">{totalStudents}</div>
          <p className="text-xs text-muted-foreground">
            Registros ativos
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Cursos Ativos
          </CardTitle>
          <BookOpen className="h-3 sm:h-4 w-3 sm:w-4 text-secondary" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-xl sm:text-2xl font-bold text-secondary">{activeCourses}</div>
          <p className="text-xs text-muted-foreground">
            {activeCourses} cursos no total
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Certificações
          </CardTitle>
          <Award className="h-3 sm:h-4 w-3 sm:w-4 text-yellow-600" />
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{totalCertificates}</div>
          <p className="text-xs text-muted-foreground">
            {totalCertificates} total
          </p>
        </CardContent>
      </Card>
    </div>
  );
};