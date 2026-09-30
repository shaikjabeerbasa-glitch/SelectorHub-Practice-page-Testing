import { type Locator, type Page } from '@playwright/test';

export type TableRow = {
  os: string;
  browser: string;
  city: string;
  country: string;
};

export class SelectorHubPage {
  readonly page: Page;
  readonly spinner: Locator;
  readonly mainHeading: Locator;
  readonly userTable: Locator;
  readonly largeTable: Locator;
  readonly formEmail: Locator;
  readonly formPassword: Locator;
  readonly paymentForm: Locator;
  readonly downloadLink: Locator;
  readonly alertButton: Locator;
  readonly promptButton: Locator;
  readonly modalButton: Locator;
  readonly uploadInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainHeading = page.getByText(/XPath & cssSelector Practice Page/i).first();
    this.spinner = page.locator('[data-spinner="assignment-loader"]').first();
    this.userTable = page.locator('table').filter({ has: page.getByText('Username') }).first();
    this.largeTable = page.locator('table').filter({ has: page.getByText('OS') }).first();
    this.formEmail = page.locator('input[name="email"], input[placeholder="Enter email"], input[type="email"]').first();
    this.formPassword = page.locator('#pass').first();
    this.paymentForm = page.locator('#paymentForm').first();
    this.downloadLink = page.locator('a[href*="Mega-sale"]').first();
    this.alertButton = page.locator("button[onclick*='windowAlertFunction']").first();
    this.promptButton = page.locator("button[onclick*='promptAlertFunction']").first();
    this.modalButton = page.locator('#myBtn').first();
    this.uploadInput = page.locator('#myFile').first();
  }

  async goto() {
    const options = {
      waitUntil: 'domcontentloaded' as const,
      timeout: 120000,
    };

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await this.page.goto('https://selectorshub.com/xpath-practice-page/', options);
        return;
      } catch (error) {
        lastError = error;
        if (attempt === 2) {
          break;
        }
      }
    }

    throw lastError;
  }

  async extractTableRows(): Promise<TableRow[]> {
    const rows = this.largeTable.locator('tbody tr');
    const count = await rows.count();
    const values: TableRow[] = [];

    for (let index = 0; index < count; index += 1) {
      const row = rows.nth(index);
      const cells = await row.locator('td').allTextContents();
      if (cells.length >= 4) {
        values.push({
          os: cells[0]?.trim() ?? '',
          browser: cells[1]?.trim() ?? '',
          city: cells[2]?.trim() ?? '',
          country: cells[3]?.trim() ?? '',
        });
      }
    }

    return values;
  }

  async getUserRowByUsername(username: string) {
    return this.userTable.locator('tbody tr').filter({ hasText: username }).first();
  }
}
