import * as playwright from "playwright";

export const createContext = async () => {
  const chromiumPath = await Bun.$`which chromium`
    .text()
    .then((output) => output.trim());

  return await playwright.chromium.launchPersistentContext("./profile", {
    executablePath: chromiumPath ?? undefined,
    headless: false,
  });
};
