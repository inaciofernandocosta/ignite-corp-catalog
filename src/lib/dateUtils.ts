/**
 * Formata uma data para exibição sem considerar timezone
 * Útil para datas que devem ser exibidas como enviadas, sem conversão de fuso horário
 */
export function formatDateWithoutTimezone(dateString: string | Date): string {
  if (!dateString) return '';
  
  // Se for uma string, extrair apenas a parte da data (YYYY-MM-DD)
  let dateOnly: string;
  if (typeof dateString === 'string') {
    dateOnly = dateString.split('T')[0]; // Remove a parte do horário se existir
  } else {
    dateOnly = dateString.toISOString().split('T')[0];
  }
  
  // Dividir a data em partes
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  // Criar a data localmente (sem timezone)
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 * sem considerar timezone
 */
export function formatDateBR(dateString: string | Date): string {
  if (!dateString) return '';
  
  let dateOnly: string;
  if (typeof dateString === 'string') {
    dateOnly = dateString.split('T')[0];
  } else {
    dateOnly = dateString.toISOString().split('T')[0];
  }
  
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata uma data para formato abreviado (DD MMM)
 * sem considerar timezone
 */
export function formatDateShort(dateString: string | Date): string {
  if (!dateString) return '';
  
  let dateOnly: string;
  if (typeof dateString === 'string') {
    dateOnly = dateString.split('T')[0];
  } else {
    dateOnly = dateString.toISOString().split('T')[0];
  }
  
  const [year, month, day] = dateOnly.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).toUpperCase().replace('.', '');
}