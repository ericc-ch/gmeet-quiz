import { createPage } from "./browser.ts";
import { env } from "./env.ts";

// Create a new page
const page = await createPage();

// Navigate to Google login page
await page.goto("https://accounts.google.com/signin");
console.log("Page title:", await page.title());

// Fill email input
await page.fill("#identifierId", env.GOOGLE_EMAIL);

// Click next button
await page.click("#identifierNext");
