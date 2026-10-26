import { test, expect } from "@playwright/test";

test.describe("Navigation & RBAC Operational Controls", () => {
  test("admin role sees full navigation suite including Audit", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Lead Admin",
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

    // Verify all core nav items exist for Admin in the top pill bar
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Procurement" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Stock" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Manufacturing" })).toBeVisible();
    await expect(page.getByRole("link", { name: "People" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reporting" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Audit" })).toBeVisible();
  });

  test("warehouse role is prevented from seeing restricted Audit item", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "warehouse-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-2",
          name: "Warehouse Officer",
          email: "warehouse@mfg.com",
          role: "Warehouse",
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

    // Should see stock
    await expect(page.getByRole("link", { name: "Stock" })).toBeVisible();

    // Should NOT see Audit
    await expect(page.getByRole("link", { name: "Audit" })).not.toBeVisible();
  });

  test("quick utility dock renders operational tools", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Lead Admin",
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

    // Verify quick utility dock is visible
    const dock = page.getByRole("complementary", { name: "Quick Utility Dock" });
    await expect(dock).toBeVisible();
    await expect(dock.getByLabel("Search operations")).toBeVisible();
    await expect(dock.getByLabel("Quick Action")).toBeVisible();
    await expect(dock.getByLabel("Toggle theme mode")).toBeVisible();
    await expect(dock.getByLabel("Support")).toBeVisible();
    await expect(dock.getByLabel("Settings")).toBeVisible();

    // Verify theme mode toggle toggles dark mode, adds .dark to html, and shows toast
    await dock.getByLabel("Toggle theme mode").click();
    await expect(page.getByText(/Dark Mode.*active/i)).toBeVisible();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Verify search modal opens, displays Quick Launcher (without Cadra), and can be closed via X button
    await dock.getByLabel("Search operations").click();
    await expect(page.getByPlaceholder("Search operations, materials, orders, or jump to page...")).toBeVisible();
    await expect(page.getByText("Quick Launcher")).toBeVisible();
    await expect(page.getByText("Cadra Quick Launcher")).not.toBeVisible();

    // Click the X cross button to cancel and close
    await page.getByLabel("Close search").click();
    await expect(page.getByPlaceholder("Search operations, materials, orders, or jump to page...")).not.toBeVisible();
  });

  test("navigating between pages updates header title and active route", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Lead Admin",
          email: "admin@mfg.com",
          role: "Admin",
        })
      );
    });

    // Mock responses for routed pages
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
    await page.route("http://localhost:3001/api/materials*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("http://localhost:3001/api/inventory*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route(
      (url) => url.port === "3001" && url.pathname.startsWith("/api/reports"),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            inventory_turnover: { total_movements: 0, receipts: 0, issues: 0, adjustments: 0 },
            procurement: { total_spend: 0, po_count: 0 },
            production: { total_orders: 0, completed_orders: 0, planned_quantity: 0, actual_yield: 0, overall_yield_rate: 0 },
            quality: { total_inspected: 0, passed_quantity: 0, failed_quantity: 0, overall_defect_rate: 0 },
          }),
        });
      }
    );

    await page.goto("/");

    // Navigate to Stock / Inventory
    await page.getByRole("link", { name: "Stock" }).click();
    await expect(page).toHaveURL("/inventory");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Inventory Management")).toBeVisible();

    // Navigate to Reporting
    await page.getByRole("link", { name: "Reporting" }).click();
    await expect(page).toHaveURL("/reports");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Reports & Insights")).toBeVisible();

    // Verify direction breadcrumb can be clicked to go back
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    await expect(breadcrumb.getByRole("link", { name: "Operations" })).toBeVisible();
    await breadcrumb.getByRole("link", { name: "Operations" }).click();
    await expect(page).toHaveURL("/");

    // Navigate to inventory, then test rollback via breadcrumb alur '/'
    await page.getByRole("link", { name: "Stock" }).click();
    await expect(page).toHaveURL("/inventory");
    await breadcrumb.getByRole("link", { name: "Operations" }).click();
    await expect(page).toHaveURL("/");
  });

  test("live operational telemetry clock pill is visible below top header across pages", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Lead Admin",
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
    await page.route("http://localhost:3001/api/materials*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });
    await page.route("http://localhost:3001/api/inventory*", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
    });

    await page.goto("/");

    // Telemetry pill is visible on Dashboard
    const telemetryPill = page.getByLabel("Live floor telemetry");
    await expect(telemetryPill).toBeVisible();
    await expect(telemetryPill.getByText(/on the floor/i)).toBeVisible();
    await expect(telemetryPill.getByText(/on track/i)).toBeVisible();

    // Navigate to Inventory - telemetry pill still visible below header
    await page.getByRole("link", { name: "Stock" }).click();
    await expect(page).toHaveURL("/inventory");
    await expect(telemetryPill).toBeVisible();

    // Navigate to People / Staff - telemetry pill still visible and singular
    await page.getByRole("link", { name: "People" }).click();
    await expect(page).toHaveURL("/staff");
    await expect(telemetryPill).toBeVisible();
    // Ensure no duplicate pill in the page content
    await expect(page.getByLabel("Live floor telemetry")).toHaveCount(1);
  });

  test("interactive manufacturing gantt schedule displays timeline and allows shifting operations", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("token", "admin-token-123");
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: "u-1",
          name: "Lead Admin",
          email: "admin@mfg.com",
          role: "Admin",
        })
      );
    });

    await page.route("http://localhost:3001/api/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/dashboard/summary")) {
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
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto("/");
    await page.getByRole("link", { name: "Manufacturing" }).click();
    await expect(page).toHaveURL("/production");

    // Verify Scheduling view is rendered
    await expect(page.getByText("4 operations running")).toBeVisible();
    await expect(page.getByText("WO-2043 is behind plan")).toBeVisible();

    // Verify work orders in Gantt chart
    await expect(page.getByText("WO-2041").first()).toBeVisible();
    await expect(page.getByText("WO-2042").first()).toBeVisible();
    await expect(page.getByText("WO-2044").first()).toBeVisible();
    await expect(page.getByText("PROD-ENC-01").first()).toBeVisible();

    // Verify sub-operations
    await expect(page.getByText(/TIG Welding/i).first()).toBeVisible();
    await expect(page.getByText(/Powder Coat/i).first()).toBeVisible();

    // Verify sidebar "On the floor now"
    await expect(page.getByText("On the floor now")).toBeVisible();
    await expect(page.getByText("Starting Next")).toBeVisible();

    // Test shifting operation forward via nudge button
    const nextBtn = page.getByTitle("Geser maju 1 hari").first();
    await nextBtn.click({ force: true });
    // Toast notification should show confirmation
    await expect(page.getByText(/digeser ke/i)).toBeVisible();

    // Test date navigation (next week and today)
    await page.getByTitle("Geser maju 1 minggu").click();
    await expect(page.getByText("Today")).toBeVisible();
    await page.getByText("Today").click();

    // Test Granularity: Switch to Month View
    await page.getByRole("button", { name: "Month" }).click();
    await expect(page.getByText("Nov 1 – Dec 5, 2026")).toBeVisible();
    await expect(page.getByText("WO-2041").first()).toBeVisible();

    // Test Granularity: Switch to Quarter View
    await page.getByRole("button", { name: "Quarter" }).click();
    await expect(page.getByText("Oct 11 – Jan 9, 2027")).toBeVisible();
    await expect(page.getByText("WEEK OF").first()).toBeVisible();

    // Switch back to Week View
    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.getByText("Nov 8 – Nov 14, 2026")).toBeVisible();

    // Test Inspecting Operation in Right Sidebar
    await page.getByText("Structural TIG Welding").first().click();
    await expect(page.getByText("Assigned To")).toBeVisible();
    await expect(page.getByText("Chain")).toBeVisible();
    await expect(page.getByText("+ 10%")).toBeVisible();

    // Test Progress Increment
    await page.getByRole("button", { name: "+ 10%" }).click();
    await expect(page.getByText(/progres naik ke/i)).toBeVisible();

    // Test Opening Work Order Modal from Sidebar
    await page.getByRole("button", { name: "Work order", exact: true }).click();
    await expect(page.getByText("Notes For The Floor")).toBeVisible();
    await expect(page.getByRole("button", { name: "Put on hold" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();

    // Close modal
    await page.locator("button:has-text('In schedule')").click();
  });
});
