// Cria um administrador (ou promove um usuário existente).
// Uso: npm run admin:create -- email@exemplo.com SenhaForte123 "Nome Opcional"
// Sem argumentos, usa a conta de demonstração (admin@agroscan.com).
import { DEMO_ADMIN, ensureAdmin } from '../src/adminSetup';

const [email = DEMO_ADMIN.email, password = DEMO_ADMIN.password, name = DEMO_ADMIN.name] = process.argv.slice(2);

if (password.length < 8) {
  console.error('A senha do administrador precisa ter pelo menos 8 caracteres.');
  process.exit(1);
}

const result = ensureAdmin(email, password, name);
const verb = { created: 'criado', promoted: 'promovido a administrador', updated: 'atualizado (já era administrador)' }[result.action];
console.log(`Usuário ${result.email} ${verb}.`);
if (email === DEMO_ADMIN.email) console.log(`Senha de demonstração: ${DEMO_ADMIN.password} (troque em produção).`);
