process.env.AWS_EXECUTION_ENV ||= "AWS_Lambda_nodejs20.x";

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import chromiumPkg from "@sparticuz/chromium";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENS_DIR = path.resolve(__dirname, "../public/screens");
fs.mkdirSync(SCREENS_DIR, { recursive: true });

const BASE = "http://127.0.0.1:3080";

async function setDataMode(mode) {
  await fetch(`${BASE}/api/data-mode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode })
  });
}

async function run() {
  await setDataMode("sample");
  const executablePath = await chromiumPkg.executablePath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: chromiumPkg.args,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: `/tmp/al2023/lib:${process.env.LD_LIBRARY_PATH || ""}`
    }
  });

  const context = await browser.newContext({
    viewport: { width: 1600, height: 960 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  const routes = [
    ["screen-landing.webp", "/"],
    ["screen-overview.webp", "/app/overview"],
    ["screen-create.webp", "/app/create"],
    ["screen-automations.webp", "/app/automations"],
    ["screen-grid.webp", "/app/grid"],
    ["screen-inbox.webp", "/app/inbox"]
  ];

  for (const [filename, route] of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(450);

    if (route === "/app/automations") {
      const png1 = await page.screenshot({ type: "jpeg", quality: 92 });
      fs.writeFileSync(path.join(SCREENS_DIR, filename), png1);
      console.log(`Captured ${filename} (${(png1.length / 1024).toFixed(1)} KB)`);

      const testBtn = page.locator("#btn-test-trigger");
      if (await testBtn.count()) {
        await testBtn.click();
        await page.waitForTimeout(450);
      }
      const png2 = await page.screenshot({ type: "jpeg", quality: 92 });
      fs.writeFileSync(path.join(SCREENS_DIR, "screen-automations-sent.webp"), png2);
      console.log(`Captured screen-automations-sent.webp (${(png2.length / 1024).toFixed(1)} KB)`);
      continue;
    }

    const buf = await page.screenshot({ type: "jpeg", quality: 92 });
    fs.writeFileSync(path.join(SCREENS_DIR, filename), buf);
    console.log(`Captured ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  }

  await setDataMode("empty");
  await page.goto(`${BASE}/app/overview`, { waitUntil: "networkidle" });
  await page.waitForTimeout(450);
  const emptyBuf = await page.screenshot({ type: "jpeg", quality: 92 });
  fs.writeFileSync(path.join(SCREENS_DIR, "screen-empty.webp"), emptyBuf);
  console.log(`Captured screen-empty.webp (${(emptyBuf.length / 1024).toFixed(1)} KB)`);

  await setDataMode("sample");
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
