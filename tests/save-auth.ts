import { chromium } from "@playwright/test";

(async () => {
  console.log("🚀 Starting auth capture...");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("📱 Opening login page...");
  await page.goto("http://localhost:3000");

  console.log(
    "\n⏸️  Please log in with Google in the browser that just opened",
  );
  console.log("After you log in and see the dashboard, press Enter here...");

  // Wait for user to press Enter
  await new Promise<void>((resolve) => {
    process.stdin.once("data", () => resolve());
  });

  console.log("\n💾 Saving authentication state...");
  await context.storageState({ path: "playwright/.auth/user.json" });

  console.log("✅ Auth saved to playwright/.auth/user.json");
  console.log("✅ You can now run tests - they will use this login session");

  await browser.close();
  process.exit(0);
})();
