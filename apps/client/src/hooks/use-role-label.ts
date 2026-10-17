'use client';

import { SYSTEM_ROLE_NAMES } from '@work-hub/constants';
import { useTranslations } from 'next-intl';

const SYSTEM_ROLES = new Set<string>(Object.values(SYSTEM_ROLE_NAMES));

/** Translated system role name (Owner / Admin / Member), else the raw string. */
export function useRoleLabel(roleName: string): string {
  const t = useTranslations('Spaces.home');
  if (SYSTEM_ROLES.has(roleName)) {
    return t(`roles.${roleName}` as 'roles.Owner');
  }
  return roleName;
}
