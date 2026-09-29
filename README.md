# SelectorHub Practice Page Testing

This repository contains a Playwright + TypeScript suite for the SelectorHub XPath practice page and its companion shadow DOM / iframe scenarios.

## Tech stack
- Playwright Test
- TypeScript in strict mode
- Page Object pattern
- Custom `test.extend` fixtures

## Project structure
- `tests/selectorhub.spec.ts` – end-to-end task coverage for the assignment
- `tests/fixtures.ts` – global noise filtering and base fixture setup
- `tests/pages/selectorhub-page.ts` – page-object locators and typed helpers
- `RECON.md` – widget map showing where each practice control actually lives
- `docs/three-hardest-problems.md` – short write-up of the three hardest issues and the eventual solution
- `.github/workflows/playwright.yml` – CI workflow that runs the suite and uploads HTML report and traces

## Setup
```bash
npm install
npx playwright install --with-deps
```

## Run locally
```bash
npm test
npm run test:chromium
npm run test:firefox
npm run test:webkit
npx playwright test --repeat-each=5 --workers=4
npx playwright show-report
```

## Known flaky areas
- The countdown banner, promo overlays, and third-party tracking requests are filtered from the test context to avoid false failures.
- The page loads dynamic content and practice widgets at different times, so the suite waits for stable state instead of hard sleeps.
- Cross-origin frames cannot be fully asserted beyond what the browser exposes; the tests only assert the supported, accessible parts.
- Canvas-based content can vary by OS, browser, and device pixel ratio, so the screenshot check is intentionally tolerant.

## CI output
The CI workflow uploads the Playwright HTML report and traces as workflow artifacts after each run.
