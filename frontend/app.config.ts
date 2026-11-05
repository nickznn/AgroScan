import { ConfigContext, ExpoConfig } from 'expo/config';

// Estende o app.json. Só a exportação da versão web hospedada em subpasta (scripts/build-web.ts)
// define AGROSCAN_WEB_BASE_URL; no dia a dia (npm run dev / npm run web) nada muda.
export default ({ config }: ConfigContext): ExpoConfig => {
  const baseUrl = process.env.AGROSCAN_WEB_BASE_URL;
  return {
    ...(config as ExpoConfig),
    experiments: { ...config.experiments, ...(baseUrl ? { baseUrl } : {}) },
  };
};
