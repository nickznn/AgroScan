// npm run setup            -> instala tudo e confere o ambiente
// npm run setup -- --clean -> apaga node_modules (app e backend) e instala do zero
import { ensureEnvironment } from './ensure';
import { c } from './lib';

(async () => {
  console.log(c.bold('\nAgroScan — preparando o ambiente\n'));
  await ensureEnvironment({ clean: process.argv.includes('--clean') });
  console.log('');
  console.log(c.bold('Tudo pronto.') + ' Para rodar o projeto:');
  console.log('');
  console.log('    npm run dev      ' + c.dim('(sobe o backend e o app juntos; escaneie o QR Code com o Expo Go)'));
  console.log('    npm run doctor   ' + c.dim('(se algo não funcionar: mostra um diagnóstico para mandar no grupo)'));
  console.log('');
})();
