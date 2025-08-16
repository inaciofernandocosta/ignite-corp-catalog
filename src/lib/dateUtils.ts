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

/**
 * Calcula a diferença em dias entre duas datas sem considerar timezone
 */
export function calculateDaysUntil(dateString: string | Date): number {
  if (!dateString) return 0;
  
  // Extrair apenas a parte da data (sem horário)
  let targetDateOnly: string;
  if (typeof dateString === 'string') {
    targetDateOnly = dateString.split('T')[0];
  } else {
    targetDateOnly = dateString.toISOString().split('T')[0];
  }
  
  // Obter data atual no formato YYYY-MM-DD
  const today = new Date();
  const todayOnly = today.toISOString().split('T')[0];
  
  // Criar datas localmente (sem timezone)
  const [targetYear, targetMonth, targetDay] = targetDateOnly.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayOnly.split('-').map(Number);
  
  const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
  const todayDate = new Date(todayYear, todayMonth - 1, todayDay);
  
  const diffTime = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}