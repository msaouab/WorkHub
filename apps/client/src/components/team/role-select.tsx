'use client';

import { ChevronDownIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRoleLabel } from '@/hooks/use-role-label';
import { cn } from '@/lib/utils';

const fieldTriggerClassName = cn(
  buttonVariants({ variant: 'outline' }),
  'w-full justify-between gap-2 px-2.5 font-normal'
);

type RoleOption = { id: string; name: string };

type RoleSelectProps = {
  labelledBy: string;
  value: string;
  roles: RoleOption[];
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

export function RoleSelect({
  labelledBy,
  value,
  roles,
  disabled,
  onValueChange,
  placeholder,
  className,
}: RoleSelectProps) {
  const selected = roles.find((role) => role.id === value);
  const selectedLabel = useRoleLabel(selected?.name ?? '');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-labelledby={labelledBy}
        disabled={disabled || roles.length === 0}
        className={cn(fieldTriggerClassName, className)}
      >
        <span className="truncate">
          {selected ? selectedLabel : placeholder}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-44">
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {roles.map((role) => (
            <RoleRadioItem key={role.id} id={role.id} name={role.name} />
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RoleRadioItem({ id, name }: { id: string; name: string }) {
  const label = useRoleLabel(name);
  return (
    <DropdownMenuRadioItem value={id}>{label}</DropdownMenuRadioItem>
  );
}
