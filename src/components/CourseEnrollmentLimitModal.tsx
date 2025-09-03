import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface CourseEnrollmentLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  totalEnrolled: number;
  maxLimit: number;
}

export const CourseEnrollmentLimitModal: React.FC<CourseEnrollmentLimitModalProps> = ({
  open,
  onOpenChange,
  courseName,
  totalEnrolled,
  maxLimit,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Vagas Encerradas
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="text-base">
              O curso <strong>{courseName}</strong> atingiu o limite máximo de alunos.
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Vagas ocupadas:</span> {totalEnrolled}/{maxLimit}
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Entre em contato com a administração para mais informações sobre novas turmas.
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};