// "Maria da Silva" -> "Maria"; "joao.souza" -> "joao"; sem nome -> "Produtor".
export function firstNameOf(name?: string | null): string {
  return name?.split(/[.\s]/)[0] || 'Produtor';
}
