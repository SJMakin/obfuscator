import { test, expect } from '@playwright/test';

test('asm.js module initializes and mutates DOM', async ({ page }) => {
  await page.goto('/public/index.html');

  // Loader present
  await page.waitForFunction(() => typeof (window as any).createObf === 'function', undefined, { timeout: 20_000 });

  // Wait for the native DOM bridge to run and mark the element
  await page.waitForSelector('#probe.ok', { timeout: 20_000 });

  // Text content validation
  const text = await page.locator('#probe').textContent();
  expect(text).toBeTruthy();
  expect(String(text)).toMatch(/^asm:\d+$/);

  // Validate that runtime export ran and we exposed the checksum
  const chk = await page.evaluate(() => (window as any).__chk >>> 0);
  expect(typeof chk).toBe('number');

  // Attribute cross-check derived from checksum
  const dataAttr = await page.getAttribute('#probe', 'data-asm');
  expect(dataAttr).toBeTruthy();
  const expected = (chk ^ 0xA5) >>> 0;
  expect(Number(dataAttr)).toBe(expected);
});