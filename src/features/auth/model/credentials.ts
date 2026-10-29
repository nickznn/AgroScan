// Regras do formulário de login/cadastro.
// A senha precisa de pelo menos 4 caracteres e o e-mail de mais de 3 (a API valida de novo no servidor).
export function canSubmitCredentials(email: string, password: string): boolean {
  return email.trim().length > 3 && password.trim().length >= 4;
}
