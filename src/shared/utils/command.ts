import { Result } from '../models';

export function messageOf(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// Executa uma ação e devolve sucesso ou a mensagem de erro, para o ViewModel nunca precisar de try/catch espalhado.
export async function attempt<T>(action: () => Promise<T>, fallback: string): Promise<Result<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (err) {
    return { ok: false, error: messageOf(err, fallback) };
  }
}

export function failure(error: string): Result<never> {
  return { ok: false, error };
}
