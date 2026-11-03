// O middleware requireAuth coloca o id e o papel do usuário logado em req.userId e req.userRole.
declare global {
  namespace Express {
    interface Request {
      userId: number;
      userRole: 'user' | 'admin';
    }
  }
}

export {};
