import db from './db';

export interface AuditActor {
  id: number;
  email: string;
}

// Registra uma ação do administrador (quem fez, o quê, em quem/no quê e detalhes).
export function logAudit(actor: AuditActor, action: string, target = '', details = ''): void {
  db.prepare('INSERT INTO audit_log (actor_id, actor_email, action, target, details, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    actor.id,
    actor.email,
    action,
    target,
    details,
    Date.now()
  );
}
