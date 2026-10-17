'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createContactSchema } from '@/lib/validators/contact';

type ContactValues = z.infer<ReturnType<typeof createContactSchema>>;

export function ContactForm() {
  const t = useTranslations('Contact');
  const tValidation = useTranslations('Validation');
  const schema = useMemo(() => createContactSchema(tValidation), [tValidation]);
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', company: '', message: '' },
  });

  const onSubmit = handleSubmit(() => {
    setSubmitted(true);
  });

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-xl border border-border bg-background/80 px-6 py-10"
      >
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {t('successTitle')}
        </h2>
        <p className="mt-3 text-muted-foreground">{t('successBody')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-name">{t('fields.name.label')}</Label>
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="contact-name"
              autoComplete="name"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t('fields.name.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">{t('fields.email.label')}</Label>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t('fields.email.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-company">{t('fields.company.label')}</Label>
        <Controller
          name="company"
          control={control}
          render={({ field, fieldState }) => (
            <Input
              id="contact-company"
              autoComplete="organization"
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              placeholder={t('fields.company.placeholder')}
              className="h-10"
              aria-invalid={fieldState.invalid || undefined}
            />
          )}
        />
        <FieldError message={errors.company?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">{t('fields.message.label')}</Label>
        <textarea
          id="contact-message"
          rows={5}
          placeholder={t('fields.message.placeholder')}
          aria-invalid={errors.message ? true : undefined}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
          {...register('message')}
        />
        <FieldError message={errors.message?.message} />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto sm:self-start"
        disabled={isSubmitting}
      >
        {t('submit')}
      </Button>
    </form>
  );
}
