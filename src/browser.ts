import * as playwright from "playwright";

export const createPage = async () => {
  const chromiumPath = await Bun.$`which chromium`.text().then(t => t.trim());
  
  const browser = await playwright.chromium.launch({
    executablePath: chromiumPath ?? undefined,
    headless: false,
  });
  const context = await browser.newContext();
  return await context.newPage();
};
