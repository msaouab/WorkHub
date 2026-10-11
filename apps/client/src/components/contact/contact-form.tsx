'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createContactSchema } from '@/lib/validators/contact';

export function ContactForm() {
  const t = useTranslations('Contact');
  const tValidation = useTranslations('Validation');
  const schema = useMemo(() => createContactSchema(tValidation), [tValidation]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = schema.safeParse({ name, email, company, message });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? tValidation('invalidInput'));
      setSubmitted(false);
      return;
    }

    setError(null);
    setSubmitted(true);
  }

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
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          value={name}
          onValueChange={setName}
          placeholder={t('fields.name.placeholder')}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-email">{t('fields.email.label')}</Label>
        <Input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onValueChange={setEmail}
          placeholder={t('fields.email.placeholder')}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-company">{t('fields.company.label')}</Label>
        <Input
          id="contact-company"
          name="company"
          autoComplete="organization"
          value={company}
          onValueChange={setCompany}
          placeholder={t('fields.company.placeholder')}
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">{t('fields.message.label')}</Label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('fields.message.placeholder')}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full sm:w-auto sm:self-start">
        {t('submit')}
      </Button>
    </form>
  );
}
