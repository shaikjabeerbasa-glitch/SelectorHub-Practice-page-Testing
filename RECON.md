# Recon and widget map

This page is noisy and some widgets are split between the main document and a few embedded frames or shadow roots. The main practice page is the public document at `https://selectorshub.com/xpath-practice-page/`.

## Main document widgets
- Dummy form fields: user email, password, company, mobile number, and the submit action live in the main document.
- User table: the row-based user table is in the main document and contains each username, role, employee name, and status.
- OS / Browser / City / Country table: rendered in the main document and has the aggregated data set for Task 2.
- Dialog controls: alert, prompt, and modal triggers are all in the main document.
- Download and upload controls: the PNG download trigger and file input are visible in the main document.
- Payment form: name, card number, expiry date, CVV, and pay button sit in the main document.
- Shadow DOM host: the page contains separate host elements for open and closed shadow-root examples, so they are not all in the regular DOM tree.

## Frame locations
- Iframe examples are hosted on separate subpages linked from the main page: `/iframe-scenario/`, `/shadow-dom-in-iframe/`, and `/iframe-in-shadow-dom/`.
- The main page includes a frame reference for the embedded practice widget, so it should be treated as a frame-backed element rather than a normal DOM node.

## Shadow root locations
- Open shadow roots are created by the page scripts and can be reached by a regular `locator` once the host is visible.
- Closed shadow roots are intentionally not accessible through Playwright selectors; they are created with `attachShadow({ mode: 'closed' })` and are intentionally hidden from selector engines.

## Noise and overlays
- The countdown banner, promo content, and third-party ad/tracking requests are not part of the automation targets and are filtered in the base fixture.
- The spinner is a transient widget that appears and then disappears after a short delay, so tests must wait for visibility and then for disappearance without sleeping.
