import { useApp } from '../context/AppContext';

// O que a navegação raiz precisa saber: ainda está verificando o login salvo? Há alguém logado?
export function useRootViewModel() {
  const { user, isLoading } = useApp();
  return { isLoading, isLoggedIn: !!user };
}
