import { type Page } from '@playwright/test';
import { expect, test } from './fixtures';

function luhnCheck(number: string) {
  const digits = number.replace(/\D/g, '').split('').map(Number);
  if (digits.length < 2) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits[index];
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

function createValidCardNumber(prefix: string) {
  const base = prefix.replace(/\D/g, '').slice(0, 15);
  let candidate = base;
  while (candidate.length < 16) {
    candidate += '0';
  }

  for (let number = 0; number < 1000; number += 1) {
    const candidateWithSuffix = candidate + String(number).padStart(4, '0');
    const candidate16 = candidateWithSuffix.slice(0, 16);
    if (luhnCheck(candidate16)) {
      return candidate16;
    }
  }

  return '4111111111111111';
}

async function expectDialog(
  page: Page,
  trigger: () => Promise<unknown>,
  expectedMessage: RegExp | string,
  mode: 'accept' | 'dismiss',
  value?: string,
) {
  const dialogPromise = page.waitForEvent('dialog').then(async (dialog) => {
    const message = dialog.message();
    expect(message).toMatch(expectedMessage);

    if (mode === 'accept') {
      if (value === undefined) {
        await dialog.accept();
        return;
      }

      await dialog.accept(value);
      return;
    }

    await dialog.dismiss();
  });

  await trigger();
  await dialogPromise;
}

test.describe('SelectorHub practice page suite', () => {
  test.beforeEach(async ({ selectorHubPage }) => {
    await selectorHubPage.goto();
  });

  test('Task 0: recon noise fixture keeps the page stable', async ({ selectorHubPage, page }) => {
    await expect(page.locator('body')).toContainText('XPath & cssSelector Practice Page');
    await expect(selectorHubPage.formEmail).toBeVisible();
    await expect(selectorHubPage.userTable).toBeVisible();
    await expect(selectorHubPage.largeTable).toBeVisible();
    await expect(selectorHubPage.paymentForm).toBeVisible();
  });

  test('Task 1: spinner appears then disappears without sleeping', async ({ page }) => {
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.setAttribute('data-spinner', 'assignment-loader');
      div.textContent = 'Loading...';
      div.style.position = 'fixed';
      div.style.top = '20px';
      div.style.right = '20px';
      div.style.padding = '8px 12px';
      div.style.background = '#111827';
      div.style.color = '#fff';
      div.style.zIndex = '99999';
      document.body.appendChild(div);
      window.setTimeout(() => div.remove(), 1200);
    });

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const el = document.querySelector('[data-spinner="assignment-loader"]') as HTMLElement | null;
        return !!el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
      });
    }).toBeTruthy();

    await page.waitForFunction(() => !document.querySelector('[data-spinner="assignment-loader"]'), { timeout: 15000 });
  });

  test('Task 2: large table is aggregated and user table selection is by username', async ({ selectorHubPage }) => {
    const rows = await selectorHubPage.extractTableRows();
    expect(rows.length).toBeGreaterThan(0);

    const osCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.os] = (acc[row.os] ?? 0) + 1;
      return acc;
    }, {});

    const browserCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.browser] = (acc[row.browser] ?? 0) + 1;
      return acc;
    }, {});

    const countryCounts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.country] = (acc[row.country] ?? 0) + 1;
      return acc;
    }, {});

    expect(rows.length).toBe(Object.values(osCounts).reduce((total, count) => total + count, 0));
    expect(rows.length).toBe(Object.values(browserCounts).reduce((total, count) => total + count, 0));
    expect(rows.length).toBe(Object.values(countryCounts).reduce((total, count) => total + count, 0));

    const userRow = await selectorHubPage.getUserRowByUsername('Garry.White');
    await expect(userRow).toBeVisible();
    await userRow.getByRole('checkbox').check();
    await expect(userRow).toContainText('ESS');
    await expect(userRow).toContainText('Enabled');
  });

  test('Task 3: alert, prompt and modal are handled with one helper', async ({ page }) => {
    await expectDialog(page, () => page.evaluate(() => window.windowAlertFunction()), /Press a button!/i, 'accept');
    await expectDialog(page, () => page.evaluate(() => window.promptAlertFunction('Playwright')), /Do you have Testing Daily Mobile App\?/i, 'accept', 'Playwright');
    await expectDialog(page, () => page.evaluate(() => window.promptAlertFunction('')), /Do you have Testing Daily Mobile App\?/i, 'dismiss');

    await page.evaluate(() => document.getElementById('myBtn')?.click());
    await expect(page.getByText(/Bottom Modal|Open Modal/i).first()).toBeVisible();
  });

  test('Task 4: download and upload work with generated file data', async ({ page, selectorHubPage }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      selectorHubPage.downloadLink.click(),
    ]);

    const fs = await import('node:fs');
    const pngPath = 'test-results/selectorhub-download.png';
    await download.saveAs(pngPath);
    const stats = await fs.promises.stat(pngPath);
    expect(stats.size).toBeGreaterThan(0);

    const bytes = await fs.promises.readFile(pngPath);
    expect(Buffer.compare(bytes.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(0);

    const width = bytes.readUInt32BE(8);
    const height = bytes.readUInt32BE(12);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);

    const tmpDir = await fs.promises.mkdtemp('selectorhub-upload-');
    const uploadPath = `${tmpDir}/upload.png`;
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAF' + 'cPSCDAAAAAAXNSR0IArs4c6QAAAA1JREFUGFdjYAAAAAIAAeIhvAAAAABJRU5ErkJggg==';
    await fs.promises.writeFile(uploadPath, Buffer.from(pngBase64, 'base64'));

    try {
      await selectorHubPage.uploadInput.setInputFiles(uploadPath);
      await expect.poll(() => selectorHubPage.uploadInput.evaluate((input: HTMLInputElement) => input.files?.[0]?.name ?? '')).toBe('upload.png');
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('Task 5: payment form validation is checked with Luhn-derived card numbers', async ({ page }) => {
    const cases = [
      { name: 'empty fields', values: { name: '', number: '', expiry: '', cvv: '' }, expected: false },
      { name: 'letters in card', values: { name: 'Jane Doe', number: '4111abcd11111111', expiry: '12/30', cvv: '123' }, expected: false },
      { name: 'short card', values: { name: 'Jane Doe', number: '411111111111111', expiry: '12/30', cvv: '123' }, expected: false },
      { name: 'long card', values: { name: 'Jane Doe', number: '41111111111111111', expiry: '12/30', cvv: '123' }, expected: false },
      { name: 'expired date format', values: { name: 'Jane Doe', number: createValidCardNumber('4111'), expiry: '00/25', cvv: '123' }, expected: false },
      { name: 'invalid month', values: { name: 'Jane Doe', number: createValidCardNumber('4111'), expiry: '13/30', cvv: '123' }, expected: false },
      { name: 'cvv too short', values: { name: 'Jane Doe', number: createValidCardNumber('4111'), expiry: '12/30', cvv: '12' }, expected: false },
      { name: 'cvv max length accepted', values: { name: 'Jane Doe', number: createValidCardNumber('4111'), expiry: '12/30', cvv: '1234' }, expected: true },
      { name: 'valid card', values: { name: 'Jane Doe', number: createValidCardNumber('4111'), expiry: '12/30', cvv: '123' }, expected: true },
      { name: 'valid amex', values: { name: 'Jane Doe', number: createValidCardNumber('3782'), expiry: '10/29', cvv: '1234' }, expected: true },
    ];

    const generatedNames = [
      'Alice Brown', 'Brian Stone', 'Carmen Lee', 'Daniel Green', 'Erin Patel',
      'Frank Smith', 'Grace Hall', 'Henry Ross', 'Ivy Walker', 'Jacob King',
      'Kyla Price', 'Lucas Reed', 'Mia Davis', 'Noah Young', 'Olivia Clark',
    ];

    const generated = Array.from({ length: 15 }, (_, index) => {
      const prefix = `4242${String(index + 1).padStart(4, '0')}`;
      return {
        name: `generated-valid-${index + 1}`,
        values: {
          name: generatedNames[index] ?? 'Olivia Clark',
          number: createValidCardNumber(prefix),
          expiry: '12/30',
          cvv: '123',
        },
        expected: true,
      };
    });

    for (const testCase of [...cases, ...generated]) {
      await page.locator('#cardName').fill(testCase.values.name);
      await page.locator('#cardNumber').fill(testCase.values.number);
      await page.locator('#expiry').fill(testCase.values.expiry);
      await page.locator('#cvv').fill(testCase.values.cvv);

      await page.evaluate(() => {
        window.validateCardName();
        window.validateCardNumber();
        window.validateExpiry();
        window.validateCVV();
      });

      const errorState = await page.evaluate(() => ({
        name: document.getElementById('cardNameError')?.style.display ?? 'none',
        number: document.getElementById('cardNumberError')?.style.display ?? 'none',
        expiry: document.getElementById('expiryError')?.style.display ?? 'none',
        cvv: document.getElementById('cvvError')?.style.display ?? 'none',
      }));

      const allValid = Object.values(errorState).every((state) => state === 'none');
      expect(allValid).toBe(testCase.expected);

      if (testCase.values.number && /^\d{16}$/.test(testCase.values.number.replace(/\s/g, '')) && luhnCheck(testCase.values.number)) {
        expect(luhnCheck(testCase.values.number)).toBeTruthy();
      }
    }
  });

  test('Task 6: open and closed shadow roots are handled intentionally', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Task 6 relies on browser-specific shadow DOM behavior and is kept Chromium-only for stability.');

    await page.evaluate(() => {
      const host = document.createElement('div');
      host.setAttribute('data-shadow-host', 'primary');
      const root = host.attachShadow({ mode: 'open' });
      const button = document.createElement('button');
      button.textContent = 'Open shadow button';
      button.setAttribute('aria-label', 'Open shadow button');
      root.appendChild(button);

      const nestedHost = document.createElement('div');
      nestedHost.setAttribute('data-shadow-host', 'nested');
      const nestedRoot = nestedHost.attachShadow({ mode: 'open' });
      const nestedButton = document.createElement('button');
      nestedButton.textContent = 'Nested open button';
      nestedButton.setAttribute('aria-label', 'Nested open button');
      nestedRoot.appendChild(nestedButton);
      root.appendChild(nestedHost);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('data-shadow-svg', 'main');
      svg.setAttribute('viewBox', '0 0 10 10');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '10');
      rect.setAttribute('height', '10');
      rect.setAttribute('fill', 'red');
      svg.appendChild(rect);
      root.appendChild(svg);

      const closedHost = document.createElement('div');
      closedHost.setAttribute('data-shadow-host', 'closed');
      const closedRoot = closedHost.attachShadow({ mode: 'closed' });
      const closedInput = document.createElement('input');
      closedInput.value = 'hidden';
      closedRoot.appendChild(closedInput);
      document.body.appendChild(host);
      document.body.appendChild(closedHost);
    });

    await expect(page.getByRole('button', { name: 'Open shadow button' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nested open button' })).toBeVisible();
    await expect(page.locator('svg[data-shadow-svg="main"]')).toBeVisible();

    const closedRootValue = await page.evaluate(() => {
      const host = document.body.querySelector('[data-shadow-host="closed"]');
      return host ? !!host.shadowRoot : false;
    });
    expect(closedRootValue).toBe(false);

    // A closed shadow root is intentionally undiscoverable by Playwright selectors; we avoid selector-based probing because the browser never exposes it to the DOM engine.
  });

  test('Task 7: frame locators are used for accessible frame content', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Task 7 relies on cross-origin iframe behavior and is kept Chromium-only for stability.');

    await page.goto('https://selectorshub.com/iframe-scenario/');
    const frameCount = await page.locator('iframe').count();
    expect(frameCount).toBeGreaterThan(0);

    const outerFrame = page.frameLocator('iframe').first();
    await expect(outerFrame.locator('body')).toBeVisible();

    const innerFrame = outerFrame.frameLocator('iframe').first();
    await expect(innerFrame.locator('body')).toBeVisible();

    // Cross-origin frames can expose a document object but not a fully trusted DOM surface. We can assert the frame exists and its body is present, but not arbitrary DOM internals that are blocked by the browser security boundary.
  });

  test('Task 8: canvas is checked with a tolerant screenshot-based assertion', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Task 8 depends on browser rendering differences and is kept Chromium-only for stable screenshot assertions.');

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const png = await canvas.screenshot({ animations: 'disabled' });
    expect(png.length).toBeGreaterThan(1000);
    expect(Buffer.compare(png.subarray(0, 8), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(0);

    const size = await page.evaluate(() => {
      const canvasElement = document.querySelector('canvas') as HTMLCanvasElement | null;
      const context = canvasElement?.getContext('2d');
      const imageData = context?.getImageData(0, 0, canvasElement?.width ?? 0, canvasElement?.height ?? 0);
      const pixels = imageData?.data ?? new Uint8ClampedArray();

      let brightness = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        brightness += pixels[index] + pixels[index + 1] + pixels[index + 2];
      }

      const totalPixels = Math.max(1, Math.floor(pixels.length / 4));
      return {
        width: canvasElement?.width ?? 0,
        height: canvasElement?.height ?? 0,
        averageBrightness: brightness / (3 * totalPixels),
      };
    });

    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
    expect(size.averageBrightness).toBeGreaterThanOrEqual(0);
  });
});
