const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:3000';

test.describe('GPU Control Hub', () => {
    test.beforeEach(async ({ page }) => {
        // Go to the starting url before each test.
        await page.goto(BASE_URL);
    });

    test('should display the dashboard title', async ({ page }) => {
        // Assert that the title is correct.
        await expect(page).toHaveTitle(/GPU Portal - Dashboard/);
        await expect(page.locator('h1')).toHaveText('GPU Portal - Dashboard');
    });

    test('should load and display cluster buttons', async ({ page }) => {
        // Assert that the cluster buttons are visible.
        await expect(page.locator('.cluster-btn')).toHaveCount(2);
        await expect(page.locator('.cluster-btn').first()).toHaveText(/Azure/);
    });

    test('should display GPU cards', async ({ page }) => {
        // Assert that the GPU cards are visible.
        const gpuCards = await page.locator('.gpu-card').count();
        expect(gpuCards).toBeGreaterThan(0);
    });

    test('should open the allocation modal when a free GPU is selected', async ({ page }) => {
        // Click the "Use GPU" button.
        await page.locator('.use-gpu-btn').first().click();

        // Click a free GPU.
        await page.locator('.gpu-card.status-Free').first().click();

        // Click the "Allocate Selected GPUs" button
        await page.locator('#execute-expand-btn').click();

        // Assert that the modal is visible.
        await expect(page.locator('#node-modal')).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText(/Allocate/);
    });

    test('should open the details modal when a used GPU is clicked', async ({ page }) => {
        // Click a used GPU.
        await page.locator('.gpu-card.status-Used').first().click();

        // Assert that the modal is visible.
        await expect(page.locator('#node-modal')).toBeVisible();
        await expect(page.locator('#modal-title')).toHaveText(/GPU:/);
    });
});
