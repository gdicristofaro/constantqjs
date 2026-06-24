# Accessibility (constantqjs)

Target: **WCAG 2.2 Level AA**.

## Automated testing

Accessibility scanning uses [Playwright](https://playwright.dev/) +
[`@axe-core/playwright`](https://github.com/dequelabs/axe-core-npm), separate from the
Angular/vitest unit tests.

```bash
npm run test:e2e            # boots `ng serve` and runs the axe scans
npx playwright test --ui    # interactive runner
```

Specs live in [`e2e/`](./e2e) (kept out of `src/` so the Angular unit runner ignores them).
They scan the WCAG A/AA tag set (`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`) across the
auto-opened **audio selection modal**, the **settings popover** inside it, and the **empty
main view** after the modal is dismissed.

> First run downloads Chromium: `npx playwright install chromium`.

axe catches roughly 30–40% of WCAG issues; the manual plan below covers the rest.

## Manual test plan (the part axe can't automate)

1. **Keyboard only:** Tab through the header (Load File), open the modal, move through tabs
   (Recommended / URL / Local file), pick a recommended file with arrow keys/Enter, open and
   close the Settings popover, and trigger Upload — all with a visible focus ring. Confirm
   focus is trapped in the dialog and returns to the trigger on close (`Esc` closes).
2. **Load a file and exercise playback:** Tab to the seek slider and transport buttons; arrow
   keys must scrub; Play/Pause/Rewind must be operable and announce state.
3. **Screen reader** (NVDA / VoiceOver): the dialog, radiogroup, and sliders announce
   meaningfully; decorative icons stay silent. The chart canvas has a text alternative — it is
   `aria-describedby` an `sr-only` data table (`audiovisualizer.component`) listing each pitch
   and its detected intensity. Confirm the table is announced, has Pitch/Value column headers,
   and reflects the current playback position as it advances.
4. **Zoom / reflow:** 200% and 400% zoom — controls and the visualizer remain usable.
5. **Contrast:** verify theme tokens in light and dark mode meet AA.
6. **Reduced motion:** confirm the modal/transition animations respect
   `prefers-reduced-motion`.
