export const contactPage = {
  title: 'Talk to us',
  description:
    'Tell us about your team. We’ll help you see if WorkHub fits leave and HR document workflows.',
  fields: {
    name: { id: 'name', label: 'Full name', placeholder: 'Alex Morgan' },
    email: {
      id: 'email',
      label: 'Work email',
      placeholder: 'alex@company.com',
    },
    company: {
      id: 'company',
      label: 'Company',
      placeholder: 'Acme Ltd',
    },
    message: {
      id: 'message',
      label: 'How can we help?',
      placeholder: 'Team size, current leave process, what you need…',
    },
  },
  submitLabel: 'Send message',
  successTitle: 'Message received',
  successBody:
    'Thanks for reaching out. We’ll get back to you within one business day.',
} as const;
