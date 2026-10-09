import { Clients } from '@/components/landing/clients';
import { FinalCta } from '@/components/landing/final-cta';
import { Hero } from '@/components/landing/hero';
import { Path } from '@/components/landing/path';
import { Problem } from '@/components/landing/problem';
import { Product } from '@/components/landing/product';
import { SiteFooter } from '@/components/landing/site-footer';
import { SiteHeader } from '@/components/landing/site-header';
import { Stats } from '@/components/landing/stats';

export default function Index() {
  return (
    <main>
      <SiteHeader />
      <Hero />
      <Problem />
      <Clients />
      <Stats />
      <Product />
      <Path />
      <FinalCta />
      <SiteFooter />
    </main>
  );
}
