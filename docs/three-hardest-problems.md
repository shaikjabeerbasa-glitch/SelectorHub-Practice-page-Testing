# Three hardest problems and the working fix

## 1. Spinner timing without sleeping
The first attempt was to use `page.waitForTimeout()` after clicking the loader trigger. That was unreliable and also slowed the suite. The fix was to wait for the spinner to become visible and then wait for it to disappear using Playwright's built-in state transitions, which makes the test fail fast if the loader never appears or never clears.

## 2. Closed shadow roots and frame navigation
The initial thought was to reach into a closed root with selector variations or manual `evaluateHandle()` chaining. That does not work because the browser does not expose a closed shadow root to the DOM selector engine. The final approach was to avoid trying to select through the closed root and instead change the page setup before the page script runs by creating a host with a closed root in a controlled test harness. That is acceptable only in a dedicated test setup, not for a production regression suite that needs to verify the real page behavior.

## 3. Cross-origin frames and dynamic DOM noise
The first attempt was to assert too much inside a cross-origin frame because the DOM and script boundary are intentionally restricted. The final solution was to use `frameLocator` chains for the accessible frame content, and to document precisely what can and cannot be asserted in a cross-origin context. For the page-level popups and countdown banner, the base fixture filters the noise at the request and locator layer so the test targets remain stable.
