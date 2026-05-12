const LEGACY_HOST = 'https://api.vvrefeicoes.com.br';
const PRODUCTION_API = 'https://pesquisa.api.vvrefeicoes.com.br';

/**
 * Base URL da API. Corrige URL legada inválida (DNS) quando o painel corre no domínio pesquisa.
 */
export function getApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/$/, '');

  if (fromEnv && fromEnv !== LEGACY_HOST) {
    return fromEnv;
  }

  if (typeof globalThis !== 'undefined' && 'location' in globalThis) {
    try {
      const host = (globalThis as unknown as { location: { hostname: string } }).location.hostname;
      if (host === 'pesquisa.vvrefeicoes.com.br' || host.endsWith('.pesquisa.vvrefeicoes.com.br')) {
        return PRODUCTION_API;
      }
    } catch {
      /* ignore */
    }
  }

  if (fromEnv === LEGACY_HOST) {
    return PRODUCTION_API;
  }

  return fromEnv || PRODUCTION_API;
}
