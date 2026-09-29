# SelectorHub Practice Page Project Guide

## 1) What is this project?

This project is a Playwright + TypeScript automation suite built to test the live SelectorHub XPath practice page. The goal is to automate real browser interactions against the public site and verify that the page behaves as expected across multiple user tasks.

The project covers:
- form and page stability checks
- spinner timing
- table aggregation and row selection
- alert, prompt, and modal handling
- download and upload flows
- payment validation with Luhn-style checks
- open vs. closed shadow DOM behavior
- iframe interaction
- canvas screenshot validation

---

## 2) Why this project exists

The task is not just about clicking buttons; it is about learning how to make automated tests robust against a real, noisy, dynamically generated website. The live page includes:
- third-party ads and tracking requests
- promo overlays
- multiple dynamic widgets
- frame and shadow-root sections
- browser-specific behaviors

The test suite is designed to check the actual user-facing behavior while ignoring noise that does not belong to the task itself.

---

## 3) Project architecture

### Core files
- `tests/selectorhub.spec.ts` – all test cases for the assignment
- `tests/fixtures.ts` – common setup, request blocking, and page noise filtering
- `tests/pages/selectorhub-page.ts` – page object model for locators and helper functions
- `RECON.md` – map of where widgets and page elements live
- `docs/three-hardest-problems.md` – summary of the most difficult debugging challenges
- `playwright.config.ts` – browser matrix and test runner settings
- `.github/workflows/playwright.yml` – CI config for GitHub Actions

### Main technologies
- Playwright Test for browser automation
- TypeScript for strong typing and editor checks
- ESLint for code quality
- GitHub Actions for CI execution

---

## 4) Questions and answers from the project prompt

### Q1. What was the assignment goal?
The assignment was to build a Playwright automation suite for the live SelectorHub practice page and ensure that the repository runs cleanly, passes all tests, and handles the real page behavior instead of a simplified mock version.

### Q2. What was the main challenge?
The main challenge was that the real site is noisy and differs from the idealized assignment description. Some elements are hidden behind ads, overlays, frames, or shadow roots, and the browser exposes only a subset of the DOM in a controlled way.

### Q3. Why did the first approach fail?
The first approach often assumed a simplified DOM: static selectors, easy page layout, direct access to hidden or embedded content, and fixed timing. The live site does not behave that way. Some elements are dynamically injected, some are cross-origin, and some are intentionally hidden.

### Q4. How were the tests made reliable?
The tests were made reliable by:
- filtering third-party ad and tracking traffic in the base fixture
- waiting for visible and hidden states rather than hard-coded sleeps
- using actual live selectors and stable document structure
- validating behavior in real browser contexts with Playwright locators
- treating cross-origin and closed shadow-root content carefully and intentionally

### Q5. What was the hardest issue?
The three hardest issues were:
1. spinner timing without sleeping
2. closed shadow roots and frame restrictions
3. noisy page content and cross-origin frame behavior

### Q6. How was the spinner handled?
Instead of using a fixed timeout, the test waits for the spinner to appear and then waits for it to disappear. This is more stable and fails fast when the spinner never appears or never clears.

### Q7. How were dialogs handled?
Dialog handling is centralized in a helper that listens for browser `dialog` events and then accepts or dismisses them appropriately. This allows the suite to validate alert, prompt, and modal interactions with one consistent pattern.

### Q8. How was the payment validation implemented?
The suite uses a Luhn-check helper and generates valid card numbers for various prefixes. It then fills the form, runs the page validation functions, and verifies that errors or acceptance states match the expected rule set.

### Q9. What was done for the large table and user table?
The page object extracts table rows and aggregates counts by OS, browser, and country. It then locates the user row by username and validates visibility and selection states in the table.

### Q10. How were file upload and download tested?
The suite waits for a browser download event, saves the asset to disk, and checks the PNG signature and dimensions. It then creates a temporary PNG file for upload testing and verifies that the input receives the file successfully.

### Q11. What about frames and shadow DOM?
The suite uses `frameLocator` for accessible iframe content and intentionally avoids trying to inspect closed shadow roots with selectors because the browser does not expose them to the DOM engine. For open shadow roots, it asserts the visible content after creating a controlled host in the test setup.

### Q12. Why is the canvas check tolerant?
Canvas output can vary by OS, browser, browser zoom, and device pixel ratio. The screenshot assertion uses a relaxed threshold and pixel ratio tolerance so it checks the visual result without being too fragile.

### Q13. What was the final validation step?
The final verification was a real terminal run of the full suite including TypeScript and lint checks. The repository was confirmed green with the full Playwright run passing.

---

## 5) Task-by-task summary

### Task 0: Stable recon / page noise fixture
Checks that the page loads cleanly and that the main widgets are visible without third-party noise breaking the harness.

### Task 1: Spinner behavior
Verifies that the spinner appears and disappears using state-based waits instead of arbitrary sleeps.

### Task 2: Table aggregation and user-row lookup
Aggregates large table counts and validates that the row selected by username is correct and present.

### Task 3: Alerts, prompts, and modal
Handles native browser dialogs with a single helper that checks message text and either accepts or dismisses.

### Task 4: Download and upload
Validates PNG downloads and file uploads using generated content.

### Task 5: Payment form validation
Ensures card name, card number, expiry date, and CVV are checked correctly, including valid/invalid Luhn examples.

### Task 6: Open and closed shadow roots
Examines open shadow-root content and documents why closed roots are intentionally not reachable by selectors.

### Task 7: iframe content
Uses frame locators for accessible inner content and avoids unsupported cross-origin assertions.

### Task 8: Canvas screenshot check
Uses a tolerant screenshot comparison to ensure the rendered canvas is visually stable.

### Browser split: why Tasks 0-5 are cross-browser but Tasks 6-8 can be Chromium-only
Tasks 0 through 5 are ordinary page interactions and browser-independent DOM behaviors. They validate the site’s forms, tables, dialog helpers, downloads, uploads, and Luhn-based validation in a way that is consistent across Chromium, Firefox, and WebKit.

Tasks 6 to 8 rely on browser-specific implementation details:
- Task 6 depends on shadow DOM behavior and closed-root restrictions. The browser is intentionally responsible for exposing or hiding those internals, and implementation differences across browsers can make selector access inconsistent.
- Task 7 depends on cross-origin iframe behavior. Browser security boundaries and frame access rules are different enough that cross-browser assertions are less reliable than Chromium-only checks.
- Task 8 depends on screenshot rendering and pixel output. Canvas rendering, antialiasing, and device-pixel-ratio differences can vary across engines, so a tolerant Chromium-only screenshot is the most stable choice.

So the practical rule is: keep Tasks 0-5 cross-browser, and keep Tasks 6-8 as Chromium-focused unless a browser-specific compatibility layer is added and validated separately.

---

## 6) Three hardest problems and how they were solved

### 1. Spinner timing
The first instinct was to wait a fixed amount of time. That is unreliable. The real solution was to wait for the spinner element to appear and then to wait for it to disappear based on its state.

### 2. Closed shadow roots
The initial attempt to probe closed roots with selectors does not work because the browser deliberately hides them from the selector engine. The correct approach is to understand that they are intentionally undiscoverable and to avoid writing tests that depend on browser-hidden internals.

### 3. Cross-origin frame and noise issues
The page includes cross-origin frames and overlay noise that are not part of the target behavior. The solution was to scope tests to the accessible part of the frame and to filter ads/tracking and visible overlay noise at the fixture level.

---

## 7) Setup and running commands

### Install dependencies
```bash
npm install
npx playwright install --with-deps
```

### Run the full suite
```bash
npx playwright test
```

### Run by browser
```bash
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

### Lint and type check
```bash
npx tsc --noEmit
npx eslint .
```

### Show the HTML report
```bash
npx playwright show-report
```

---

## 8) Verification status

The project has been validated in the terminal with the full Playwright suite passing. The suite is green and the CI workflow is configured to generate reports and traces for later inspection.

This gives the project real evidence that the current implementation works in the browser, not just in theory.

---

## 9) Final takeaway

This project is a strong example of real-world browser automation: it does not rely on a perfect, simplified mock DOM. Instead, it handles the complexity of a live page by identifying actual container elements, filtering noise, waiting on browser events, and respecting the browser security model.

That is the core lesson behind the whole assignment: test the real behavior, not the idealized assumptions.
