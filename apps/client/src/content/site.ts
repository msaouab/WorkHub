/**
 * Shared chrome copy (brand, nav, footer) used across pages.
 * Keep UI presentational; swap via next-intl later using stable keys.
 */

export const site = {
  brand: 'WorkHub',
  nav: {
    product: { label: 'Product', href: '/#product' },
    contact: { label: 'Talk to us', href: '/contact' },
  },
  footer: {
    tagline: 'Leave, holidays, and HR documents for growing teams.',
  },
} as const;
