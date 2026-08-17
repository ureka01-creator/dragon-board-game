const { test, expect } = require('@playwright/test');

async function startSolo(page) {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto('/');
  await page.locator('#titleStartBtn').tap();
  await page.locator('.hero-card').first().tap();
  await page.locator('#startGameBtn').tap();
  await expect(page.locator('#gameScreen')).toHaveClass(/active/);
  await expect(page.locator('.party-status-btn').first()).toBeVisible();

  return pageErrors;
}

async function viewportSnapshot(page) {
  return page.evaluate(() => {
    const modal = document.querySelector('#modal');
    const card = modal?.querySelector('.modal-card');
    const sheet = modal?.querySelector('.hero-status-sheet');
    const vv = window.visualViewport;
    const rect = card?.getBoundingClientRect();
    const sheetRect = sheet?.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      modalClass: modal?.className || '',
      modalDisplay: modal ? getComputedStyle(modal).display : null,
      modalPosition: modal ? getComputedStyle(modal).position : null,
      bodyPosition: getComputedStyle(document.body).position,
      bodyTop: getComputedStyle(document.body).top,
      visualViewport: {
        offsetTop: vv?.offsetTop || 0,
        offsetLeft: vv?.offsetLeft || 0,
        width: vv?.width || window.innerWidth,
        height: vv?.height || window.innerHeight,
      },
      card: rect ? {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      } : null,
      sheet: sheetRect ? {
        top: sheetRect.top,
        bottom: sheetRect.bottom,
        width: sheetRect.width,
        height: sheetRect.height,
      } : null,
    };
  });
}

function expectCardInsideVisibleViewport(snapshot) {
  expect(snapshot.card, 'modal card must exist').not.toBeNull();
  const vvTop = snapshot.visualViewport.offsetTop;
  const vvBottom = vvTop + snapshot.visualViewport.height;
  const vvLeft = snapshot.visualViewport.offsetLeft;
  const vvRight = vvLeft + snapshot.visualViewport.width;

  expect(snapshot.card.bottom, 'card must intersect visible viewport vertically').toBeGreaterThan(vvTop + 8);
  expect(snapshot.card.top, 'card top must be above visible viewport bottom').toBeLessThan(vvBottom - 8);
  expect(snapshot.card.right, 'card must intersect visible viewport horizontally').toBeGreaterThan(vvLeft + 8);
  expect(snapshot.card.left, 'card left must be before visible viewport right').toBeLessThan(vvRight - 8);
}

test.describe('iPhone hero status modal regression', () => {
  test('status button opens a visible, interactive status sheet after page scroll', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-iphone', 'This regression covers the iPhone Safari path.');

    const pageErrors = await startSolo(page);
    const statusButton = page.locator('.party-status-btn').first();
    const modal = page.locator('#modal');
    const sheet = page.locator('.hero-status-sheet');
    const closeButton = page.locator('#modalCloseBtn');

    await statusButton.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 260));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const beforeScroll = await page.evaluate(() => window.scrollY);

    await statusButton.tap();

    await expect(modal, 'status tap must remove the hidden class').not.toHaveClass(/\bhidden\b/);
    await expect(modal, 'modal overlay must render').toBeVisible();
    await expect(sheet, 'hero status content must render').toBeVisible();
    await expect(closeButton, 'close control must remain reachable').toBeVisible();

    const opened = await viewportSnapshot(page);
    expectCardInsideVisibleViewport(opened);

    await closeButton.tap();
    await expect(modal).toHaveClass(/\bhidden\b/);
    await expect(page.locator('#rollBtn')).toBeVisible();
    await expect(page.locator('#rollBtn')).toBeEnabled();

    const afterScroll = await page.evaluate(() => window.scrollY);
    expect(Math.abs(afterScroll - beforeScroll), 'closing status must restore the previous page position').toBeLessThanOrEqual(4);
    expect(pageErrors, 'page must not throw while opening or closing status').toEqual([]);
  });

  test('status modal survives repeated touch open/close without observer lockup', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-iphone', 'This regression covers the iPhone Safari path.');

    const pageErrors = await startSolo(page);
    const statusButton = page.locator('.party-status-btn').first();
    const modal = page.locator('#modal');
    const closeButton = page.locator('#modalCloseBtn');

    await statusButton.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 220));

    for (let i = 0; i < 3; i += 1) {
      await statusButton.tap();
      await expect(modal, `cycle ${i + 1}: modal must open`).not.toHaveClass(/\bhidden\b/);
      await expect(page.locator('.hero-status-sheet'), `cycle ${i + 1}: sheet must be visible`).toBeVisible();
      const opened = await viewportSnapshot(page);
      expectCardInsideVisibleViewport(opened);
      await closeButton.tap();
      await expect(modal, `cycle ${i + 1}: modal must close`).toHaveClass(/\bhidden\b/);
    }

    expect(pageErrors, 'repeated status use must not throw').toEqual([]);
  });
});
