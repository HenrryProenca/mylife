import type { LucideIcon } from 'lucide-react';
import { ShoppingCart, Wallet } from 'lucide-react';

export interface MyLifeModule {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  enabled: boolean;
}

export const MYLIFE_MODULES: MyLifeModule[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: Wallet,
    path: '/financeiro',
    enabled: true,
  },
  {
    id: 'lista-mercado',
    label: 'Lista de Mercado',
    icon: ShoppingCart,
    path: '/lista-mercado',
    enabled: true,
  },
  // Futuros:
  // { id: 'rotina',   label: 'Rotina',   icon: Calendar,  path: '/rotina',   enabled: false },
  // { id: 'estudos',  label: 'Estudos',  icon: BookOpen,  path: '/estudos',  enabled: false },
  // { id: 'saude',    label: 'Saúde',    icon: Heart,     path: '/saude',    enabled: false },
];