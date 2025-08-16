/**
 * Aplica máscara de telefone brasileiro (00) 00000-0000
 */
export function applyPhoneMask(value: string): string {
  // Remove tudo que não for número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a máscara baseada no tamanho
  if (limitedNumbers.length === 0) {
    return '';
  } else if (limitedNumbers.length <= 2) {
    return `(${limitedNumbers}`;
  } else if (limitedNumbers.length <= 6) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  } else if (limitedNumbers.length <= 10) {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
  } else {
    return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  }
}

/**
 * Remove a máscara do telefone, retornando apenas números
 */
export function removePhoneMask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Valida formato de e-mail em tempo real
 */
export function validateEmailFormat(email: string): boolean {
  // Regex básica para validação de e-mail
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Valida caracteres permitidos em e-mail durante digitação
 */
export function isValidEmailCharacter(char: string): boolean {
  // Permite letras, números, pontos, underscore, hífen, mais, arroba
  const validChars = /^[a-zA-Z0-9._%+-@]$/;
  return validChars.test(char);
}

/**
 * Filtra entrada de e-mail removendo caracteres inválidos
 */
export function filterEmailInput(value: string): string {
  return value
    .split('')
    .filter(char => isValidEmailCharacter(char))
    .join('')
    .toLowerCase(); // E-mails são case-insensitive
}