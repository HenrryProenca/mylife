import type { HouseholdRole } from './types';

export function podeEscreverNoHousehold(papel: HouseholdRole | null | undefined): boolean {
  return papel !== null && papel !== undefined && papel !== 'visualizador';
}

export function podeGerenciarHousehold(papel: HouseholdRole | null | undefined): boolean {
  return papel === 'owner' || papel === 'admin';
}
