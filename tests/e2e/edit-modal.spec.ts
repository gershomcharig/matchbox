import { test, expect } from './fixtures/auth';
import { waitForMapLoad, openCollectionsPanel } from './fixtures/test-helpers';

test.describe('Edit modal behavior', () => {
  test.beforeEach(async ({ page }) => {
    await waitForMapLoad(page);
  });

  test('edit modal hides place panel and restores it on close', async ({ page }) => {
    // Open collections panel to find a place
    await openCollectionsPanel(page);

    // Check if there are any collections
    const collections = page.locator('[data-testid="collection-item"]');
    const collectionCount = await collections.count();

    if (collectionCount === 0) {
      test.skip(true, 'No collections available for testing');
      return;
    }

    // Click on the first collection
    await collections.first().click();

    // Wait for places list to load
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();

    // Check if there are any places in this collection
    const places = page.locator('[data-testid="place-item"]');
    const placeCount = await places.count();

    if (placeCount === 0) {
      test.skip(true, 'No places in collection for testing');
      return;
    }

    // Click on the first place to open details panel
    await places.first().click();

    // Verify place details panel is open
    const placePanel = page.locator('[data-testid="place-details-panel"]');
    await expect(placePanel).toBeVisible();

    // Click the edit button
    const editButton = page.locator('[data-testid="edit-place-button"]');
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify edit modal is visible
    const editModal = page.locator('[data-testid="edit-place-modal"]');
    await expect(editModal).toBeVisible();

    // Verify place panel is hidden when edit modal is open
    await expect(placePanel).not.toBeVisible();

    // Close the edit modal by clicking the close button
    const closeButton = page.locator('[data-testid="edit-place-modal-close-button"]');
    await closeButton.click();

    // Verify edit modal is closed
    await expect(editModal).not.toBeVisible();

    // Verify place panel is restored
    await expect(placePanel).toBeVisible();
  });

  test('edit modal closes with backdrop click and restores panel', async ({ page }) => {
    // Open collections panel to find a place
    await openCollectionsPanel(page);

    // Check if there are any collections
    const collections = page.locator('[data-testid="collection-item"]');
    const collectionCount = await collections.count();

    if (collectionCount === 0) {
      test.skip(true, 'No collections available for testing');
      return;
    }

    // Click on the first collection
    await collections.first().click();
    await expect(page.locator('[data-testid="collection-back-button"]')).toBeVisible();

    // Check if there are any places
    const places = page.locator('[data-testid="place-item"]');
    const placeCount = await places.count();

    if (placeCount === 0) {
      test.skip(true, 'No places in collection for testing');
      return;
    }

    // Open place details
    await places.first().click();
    const placePanel = page.locator('[data-testid="place-details-panel"]');
    await expect(placePanel).toBeVisible();

    // Open edit modal
    await page.locator('[data-testid="edit-place-button"]').click();
    const editModal = page.locator('[data-testid="edit-place-modal"]');
    await expect(editModal).toBeVisible();

    // Click the backdrop to close
    const backdrop = page.locator('[data-testid="modal-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Verify modal closed and panel restored
    await expect(editModal).not.toBeVisible();
    await expect(placePanel).toBeVisible();
  });
});
