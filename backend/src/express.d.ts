// O middleware requireAuth coloca o id do usuário logado em req.userId.
declare global {
  namespace Express {
    interface Request {
      userId: number;
    }
  }
}

export {};
