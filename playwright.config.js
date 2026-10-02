const { defineConfig } = require("@playwright/test");

const deployedBaseURL=(process.env.BASE_URL||"").trim();
const localBaseURL="http://127.0.0.1:4173/";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: deployedBaseURL||localBaseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  ...(deployedBaseURL?{}:{
    webServer: {
      command: "python3 -m http.server 4173 --bind 127.0.0.1",
      url: localBaseURL+"/index.html",
      reuseExistingServer: false,
      timeout: 15000
    }
  }),
  projects: [
    { name: "desktop-chromium", use: { browserName: "chromium", viewport: { width: 1280, height: 900 } } },
    { name: "phone-chromium", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ]
});
