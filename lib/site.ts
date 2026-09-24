export const SITE = {
  name: 'OmniDesk',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  description:
    'OmniDesk answers every call for independent dental practices, books appointments into your schedule, collects deposits and brings patients back with recall.',
  demo: process.env.NEXT_PUBLIC_DEMO === '1',
};
