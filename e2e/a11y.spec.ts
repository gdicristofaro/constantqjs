import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// WCAG 2.2 Level AA (plus the earlier A/AA baselines axe maps onto these tags).
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function expectNoViolations(page: Page, context?: string) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(results.violations, formatViolations(results.violations, context)).toEqual([]);
}

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder['analyze']>>['violations'],
  context?: string
) {
  if (violations.length === 0) return 'no violations';
  const header = context ? `axe violations (${context}):` : 'axe violations:';
  return [
    header,
    ...violations.map((v) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`),
  ].join('\n');
}

// The app renders two native <dialog> elements (selection + loading); scope to the open one.
const openDialog = (page: Page) => page.locator('dialog[open]');

test.describe('constantqjs accessibility', () => {
  // The app auto-opens the "Upload Audio" selection modal on load.
  test('audio selection modal (default view) has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(openDialog(page)).toBeVisible();
    await expectNoViolations(page, 'audio selection modal');
  });

  test('settings popover inside the modal has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(openDialog(page)).toBeVisible();
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    await expectNoViolations(page, 'settings popover');
  });

  test('empty main view (modal dismissed) has no axe violations', async ({ page }) => {
    await page.goto('/');
    await expect(openDialog(page)).toBeVisible();
    // Dismiss the modal via the Cancel button to reach the empty "Load an audio file" view.
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(openDialog(page)).toHaveCount(0);
    await expectNoViolations(page, 'empty main view');
  });
});
