import {
  LandingItemText,
  LandingItemTitle,
  LandingSection,
  LandingSectionBody,
  LandingSectionHeader,
} from '@/components/landing/section';
import { landingPage } from '@/content/landing';

export function Product() {
  const { product } = landingPage;

  return (
    <LandingSection id="product" aria-labelledby="landing-product-title">
      <LandingSectionHeader
        id="landing-product-title"
        title={product.title}
        description={product.description}
      />

      <LandingSectionBody>
        <ul className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {product.pillars.map((pillar) => (
            <li key={pillar.id} className="max-w-sm">
              <LandingItemTitle>{pillar.title}</LandingItemTitle>
              <LandingItemText>{pillar.description}</LandingItemText>
            </li>
          ))}
        </ul>
      </LandingSectionBody>
    </LandingSection>
  );
}
