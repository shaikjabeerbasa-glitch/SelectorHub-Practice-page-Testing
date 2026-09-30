import { test as base } from '@playwright/test';
import { SelectorHubPage } from './pages/selectorhub-page';

export const test = base.extend<{ selectorHubPage: SelectorHubPage }>({
  selectorHubPage: async ({ page }, use) => {
    const noisePatterns = [
      'googletagmanager.com',
      'google-analytics.com',
      'googlesyndication.com',
      'doubleclick.net',
      'adservice.google.com',
      'analytics.google.com',
      'googleservices.com',
    ];

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const shouldBlock = noisePatterns.some((pattern) => url.includes(pattern));
      if (shouldBlock) {
        await route.abort();
        return;
      }

      await route.continue();
    });

    const selectorHubPage = new SelectorHubPage(page);
    await use(selectorHubPage);
  },
});

export { expect } from '@playwright/test';
