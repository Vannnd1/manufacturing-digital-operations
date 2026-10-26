import { test, expect } from "@playwright/test";

test.describe("Authentication & RBAC Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("displays login page, form controls, and demo role buttons", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "MfgOps System" })).toBeVisible();
    await expect(page.getByText("Enterprise Manufacturing Platform")).toBeVisible();
    await expect(page.getByLabel("Work Email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Access System" })).toBeVisible();

    // Verify all demo role buttons exist
    const demoRoles = ["Admin", "Manager", "Purchasing", "Warehouse", "Production", "Quality"];
    for (const role of demoRoles) {
      await expect(page.getByRole("button", { name: role, exact: true })).toBeVisible();
    }
  });

  test("quick-fill demo buttons populate email and password fields", async ({ page }) => {
    await page.goto("/login");

    // Click Purchasing quick-fill
    await page.getByRole("button", { name: "Purchasing", exact: true }).click();
    await expect(page.getByLabel("Work Email")).toHaveValue("purchasing@mfg.com");
    await expect(page.locator("input#password")).toHaveValue("demo123");

    // Click Warehouse quick-fill
    await page.getByRole("button", { name: "Warehouse", exact: true }).click();
    await expect(page.getByLabel("Work Email")).toHaveValue("warehouse@mfg.com");
    await expect(page.locator("input#password")).toHaveValue("demo123");
  });

  test("shows clear error banner when login credentials fail", async ({ page }) => {
    // Intercept backend auth endpoint with 401 response
    await page.route("http://localhost:3001/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Invalid email or password." }),
      });
    });

    await page.goto("/login");
    await page.getByLabel("Work Email").fill("wrong@mfg.com");
    await page.locator("input#password").fill("wrongpassword");
    await page.getByRole("button", { name: "Access System" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });

  test("successful login redirects to dashboard and populates user info", async ({ page }) => {
    // Mock login endpoint
    await page.route("http://localhost:3001/api/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "mock-jwt-token-12345",
          user: {
            id: "u-101",
            name: "John Doe",
            email: "purchasing@mfg.com",
            role: "Purchasing",
          },
        }),
      });
    });

    // Mock dashboard summary
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

    await page.goto("/login");
    await page.getByRole("button", { name: "Purchasing", exact: true }).click();
    await page.getByRole("button", { name: "Access System" }).click();

    // Verify redirected to dashboard
    await expect(page).toHaveURL("/");
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Purchasing Access")).toBeVisible();
  });

  test("redirects unauthenticated user accessing protected route back to /login", async ({ page }) => {
    await page.goto("/procurement");
    await expect(page).toHaveURL(/.*\/login/);
  });

  test("sign out button clears session and redirects back to /login", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "mock-token-abc");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-admin",
          name: "System Admin",
          email: "admin@mfg.com",
          role: "Admin",
        })
      );
    });

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
    await expect(page.getByText("System Admin")).toBeVisible();

    // Click Sign out button
    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL("/login");
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });
});
