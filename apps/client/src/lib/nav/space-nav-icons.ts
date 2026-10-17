import {
  CalendarDaysIcon,
  FileTextIcon,
  HomeIcon,
  ListChecksIcon,
  MailPlusIcon,
  NetworkIcon,
  PartyPopperIcon,
  SettingsIcon,
  ShieldIcon,
  SlidersHorizontalIcon,
  TreePalmIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';
import type { SpaceNavIcon } from '@/lib/nav/space-nav';

export const SPACE_NAV_ICONS: Record<SpaceNavIcon, LucideIcon> = {
  home: HomeIcon,
  palmtree: TreePalmIcon,
  calendar: CalendarDaysIcon,
  party: PartyPopperIcon,
  file: FileTextIcon,
  users: UsersIcon,
  checks: ListChecksIcon,
  mail: MailPlusIcon,
  shield: ShieldIcon,
  network: NetworkIcon,
  sliders: SlidersHorizontalIcon,
  settings: SettingsIcon,
};
