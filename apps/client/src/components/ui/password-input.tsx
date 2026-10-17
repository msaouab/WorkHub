'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type PasswordInputProps = Omit<ComponentProps<typeof Input>, 'type'>;

function PasswordInput({ className, ...props }: PasswordInputProps) {
  const t = useTranslations('Auth.fields.password');
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative" dir="ltr">
      <Input
        type={visible ? 'text' : 'password'}
        dir="ltr"
        className={cn('pr-10 text-left', className)}
        {...props}
      />
      <button
        type="button"
        className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? t('hide') : t('show')}
      >
        {visible ? (
          <EyeOffIcon className="size-4" aria-hidden />
        ) : (
          <EyeIcon className="size-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
