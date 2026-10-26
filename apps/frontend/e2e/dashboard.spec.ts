import { test, expect } from "@playwright/test";

test.describe("Dashboard & Manufacturing Operations Explorer", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-session-xyz");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Operations Admin",
          email: "admin@mfg.com",
          role: "Admin",
        })
      );
      localStorage.setItem("mfg-dashboard-guide", "expanded");
    });
  });

  test("renders KPI summary metric cards with accurate values", async ({ page }) => {
    await page.route("http://localhost:3001/api/dashboard/summary", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          inventory: {
            low_stock_items: [
              { id: "1", sku: "RES-10K", name: "Resistor 10k", current_stock: 5, min_stock: 50, unit: "PCS" },
              { id: "2", sku: "CAP-100U", name: "Capacitor 100uF", current_stock: 2, min_stock: 20, unit: "PCS" },
            ],
          },
          procurement: {
            pr_status_counts: { Pending: 7, Approved: 3 },
          },
          production: {
            order_status_counts: { Ready: 2, In_Progress: 1 },
          },
          quality: {
            recent_failed_inspections: [],
          },
        }),
      });
    });

    await page.goto("/");

    // Verify Dashboard page title
    await expect(page.getByRole("heading", { name: "Operational Command Center" })).toBeVisible();

    // Verify KPI cards
    await expect(page.getByText("Low Stock Alerts")).toBeVisible();
    await expect(page.getByText("Purchase Requests")).toBeVisible();
    await expect(page.getByText("Active Production")).toBeVisible();

    // Verify calculated metric values
    await expect(page.getByText("2 items require replenishment")).toBeVisible();
    await expect(page.getByText("Awaiting manager approval")).toBeVisible();
  });

  test("interactive manufacturing workflow guide toggles between expanded and collapsed", async ({ page }) => {
    await page.route("http://localhost:3001/api/dashboard/summary", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          inventory: { low_stock_items: [] },
          procurement: { pr_status_counts: {} },
          production: { order_status_counts: {} },
          quality: { recent_failed_inspections: [] },
        }),
      });
    });

    await page.goto("/");

    const guideHeading = page.getByText("End-to-End Manufacturing Workflow Tour");
    await expect(guideHeading).toBeVisible();

    // Click Hide Tour button
    const hideButton = page.getByRole("button", { name: /Hide Tour/i });
    await hideButton.click();

    // Guide content should disappear
    await expect(guideHeading).not.toBeVisible();

    // Click Workflow Tour button to restore
    const showButton = page.getByRole("button", { name: /Workflow Tour/i });
    await showButton.click();
    await expect(guideHeading).toBeVisible();
  });

  test("refresh button triggers dashboard data reload", async ({ page }) => {
    let callCount = 0;
    await page.route("http://localhost:3001/api/dashboard/summary", async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          inventory: { low_stock_items: [] },
          procurement: { pr_status_counts: {} },
          production: { order_status_counts: {} },
          quality: { recent_failed_inspections: [] },
        }),
      });
    });

    await page.goto("/");

    // Wait for initial API load
    await expect.poll(() => callCount).toBeGreaterThanOrEqual(1);

    // Click quick refresh button
    const refreshButton = page.getByRole("button", { name: "Refresh operational data" });
    await refreshButton.click();

    // Confirm reload occurred
    await expect.poll(() => callCount).toBeGreaterThanOrEqual(2);
  });
});
