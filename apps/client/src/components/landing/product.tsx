import { getTranslations } from 'next-intl/server';
import {
  LandingItemText,
  LandingItemTitle,
  LandingSection,
  LandingSectionBody,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingStructure } from '@/content/landing-structure';

export async function Product() {
  const t = await getTranslations('Landing.product');

  return (
    <LandingSection id="product" aria-labelledby="landing-product-title">
      <LandingSectionHeader
        id="landing-product-title"
        title={t('title')}
        description={t('description')}
      />

      <LandingSectionBody>
        <ul className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {landingStructure.product.pillarIds.map((id) => (
            <li key={id} className="max-w-sm">
              <LandingItemTitle>{t(`pillars.${id}.title`)}</LandingItemTitle>
              <LandingItemText>{t(`pillars.${id}.description`)}</LandingItemText>
            </li>
          ))}
        </ul>
      </LandingSectionBody>
    </LandingSection>
  );
}
